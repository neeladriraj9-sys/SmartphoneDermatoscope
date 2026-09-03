# Deployment Guide — SkinScan AI

Full AWS serverless deployment using S3, CloudFront, Lambda, API Gateway, and DynamoDB.

# deployment
cd /mnt/d/shared/trial/skinscan-ai
npm install
npx vite build
or
chmod +x node_modules/.bin/vite
npm run build
aws s3 mb s3://skinscan-ai-frontend-976193236457 --region us-east-1
aws s3 sync dist/ s3://skinscan-ai-frontend-976193236457 --delete --region us-east-1
aws cloudfront list-distributions --query "DistributionList.Items[*].{Id:Id,Domain:DomainName}" --output table
aws cloudfront get-distribution-config --id E19ARE5ZA88HIZ --query "DistributionConfig.Origins.Items[0].DomainName" --output text
# observe: skinscanai.s3-website-us-east-1.amazonaws.com
aws s3 sync dist/ s3://skinscanai --delete --region us-east-1
aws cloudfront create-invalidation --distribution-id E19ARE5ZA88HIZ --paths "/*"
aws cloudfront get-invalidation --distribution-id E19ARE5ZA88HIZ --id IBBJMOARSTS1QFTOAI32BFFVLL --query "Invalidation.Status" --output text

---

## Architecture

```
┌────────────┐      ┌────────────────┐      ┌───────────────┐
│  CloudFront│─────▶│  S3 (frontend) │      │  API Gateway  │
└────────────┘      └────────────────┘      └───────┬───────┘
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               ▼               ▼
                              ┌──────────┐   ┌──────────────┐  ┌──────────────┐
                              │ register │   │  verify-otp  │  │ scan-analyze │
                              │  Lambda  │   │    Lambda    │  │    Lambda    │
                              └────┬─────┘   └──────┬───────┘  └──────┬───────┘
                                   │                │                  │
                                   ▼                ▼                  ▼
                              ┌──────────────────────────┐      ┌──────────┐
                              │  DynamoDB (skinscan-users)│      │ S3 scans │
                              └──────────────────────────┘      └──────────┘
```

---

## Prerequisites

- AWS CLI configured with appropriate IAM permissions
- Node.js 18+ or Bun installed locally
- AWS account ID: `976193236457`
- Region: `us-east-1`

---

## 1. Backend Deployment

### 1.1 Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name skinscan-users \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --key-schema AttributeName=email,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 1.2 Create S3 Bucket for Scan Images

```bash
aws s3 mb s3://skinscan-user-scans --region us-east-1

aws s3api put-bucket-policy --bucket skinscan-user-scans --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::skinscan-user-scans/*",
    "Condition": {
      "Bool": { "aws:SecureTransport": "false" }
    }
  }]
}'
```

### 1.3 Create IAM Role for Lambda

```bash
aws iam create-role \
  --role-name skinscan-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam put-role-policy \
  --role-name skinscan-lambda-role \
  --policy-name skinscan-lambda-policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:us-east-1:976193236457:*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query"
        ],
        "Resource": "arn:aws:dynamodb:us-east-1:976193236457:table/skinscan-users"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ],
        "Resource": "arn:aws:s3:::skinscan-user-scans/*"
      },
      {
        "Effect": "Allow",
        "Action": "secretsmanager:GetSecretValue",
        "Resource": "arn:aws:secretsmanager:us-east-1:976193236457:secret:opencrm/frappe-api-key-iQgSaZ"
      }
    ]
  }'
```

### 1.4 Deploy Register Lambda

```bash
cd cloud/lambda

zip register.zip register.py

aws lambda create-function \
  --function-name skinscan-register \
  --runtime python3.12 \
  --role arn:aws:iam::976193236457:role/skinscan-lambda-role \
  --handler register.lambda_handler \
  --zip-file fileb://register.zip \
  --timeout 30 \
  --memory-size 128 \
  --region us-east-1
```

To update an existing function:

```bash
zip register.zip register.py
aws lambda update-function-code \
  --function-name skinscan-register \
  --zip-file fileb://register.zip \
  --region us-east-1
```

### 1.5 Deploy Verify OTP Lambda

```bash
zip verify_otp.zip verify_otp.py

aws lambda create-function \
  --function-name skinscan-verify-otp \
  --runtime python3.12 \
  --role arn:aws:iam::976193236457:role/skinscan-lambda-role \
  --handler verify_otp.lambda_handler \
  --zip-file fileb://verify_otp.zip \
  --timeout 10 \
  --memory-size 128 \
  --region us-east-1
```

### 1.6 Create API Gateway (REST API)

```bash
# Create the API
aws apigateway create-rest-api \
  --name skinscan-api \
  --endpoint-configuration types=REGIONAL \
  --region us-east-1

# Note the API ID from the output, e.g., "abc123def4"
# Export it for subsequent commands:
# set API_ID=abc123def4   (Windows)
# export API_ID=abc123def4 (Linux/Mac)
```

### 1.7 Create API Resources and Methods

```bash
# Get root resource ID
aws apigateway get-resources --rest-api-id %API_ID% --region us-east-1
# Note the root resource id (/)

# Create /register resource
aws apigateway create-resource \
  --rest-api-id %API_ID% \
  --parent-id %ROOT_ID% \
  --path-part register \
  --region us-east-1

# Create POST method on /register
aws apigateway put-method \
  --rest-api-id %API_ID% \
  --resource-id %REGISTER_RESOURCE_ID% \
  --http-method POST \
  --authorization-type NONE \
  --region us-east-1

# Create OPTIONS method for CORS on /register
aws apigateway put-method \
  --rest-api-id %API_ID% \
  --resource-id %REGISTER_RESOURCE_ID% \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region us-east-1

# Integrate POST /register with Lambda
aws apigateway put-integration \
  --rest-api-id %API_ID% \
  --resource-id %REGISTER_RESOURCE_ID% \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:976193236457:function:skinscan-register/invocations \
  --region us-east-1

# Create /verify-otp resource
aws apigateway create-resource \
  --rest-api-id %API_ID% \
  --parent-id %ROOT_ID% \
  --path-part verify-otp \
  --region us-east-1

# Create POST method on /verify-otp
aws apigateway put-method \
  --rest-api-id %API_ID% \
  --resource-id %VERIFY_RESOURCE_ID% \
  --http-method POST \
  --authorization-type NONE \
  --region us-east-1

# Integrate POST /verify-otp with Lambda
aws apigateway put-integration \
  --rest-api-id %API_ID% \
  --resource-id %VERIFY_RESOURCE_ID% \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:976193236457:function:skinscan-verify-otp/invocations \
  --region us-east-1
```

### 1.8 Grant API Gateway Permission to Invoke Lambdas

```bash
aws lambda add-permission \
  --function-name skinscan-register \
  --statement-id apigateway-invoke-register \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:976193236457:%API_ID%/*/POST/register" \
  --region us-east-1

aws lambda add-permission \
  --function-name skinscan-verify-otp \
  --statement-id apigateway-invoke-verify \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:976193236457:%API_ID%/*/POST/verify-otp" \
  --region us-east-1
```

### 1.9 Deploy API Gateway

```bash
aws apigateway create-deployment \
  --rest-api-id %API_ID% \
  --stage-name prod \
  --region us-east-1
```

Your API base URL will be:
```
https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod
```

---

## 2. Frontend Deployment

### 2.1 Create S3 Bucket for Frontend

```bash
aws s3 mb s3://skinscan-frontend --region us-east-1

aws s3api put-bucket-policy --bucket skinscan-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontOAC",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::skinscan-frontend/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::976193236457:distribution/<DISTRIBUTION_ID>"
      }
    }
  }]
}'
```

> Update `<DISTRIBUTION_ID>` after creating the CloudFront distribution in step 2.3.

### 2.2 Build the Frontend

Create `.env` in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_API_BASE_URL=https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod
```

Build:

```bash
bun install
bun run build
```

Upload to S3:

```bash
aws s3 sync dist/ s3://skinscan-frontend --delete --region us-east-1
```

### 2.3 Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name skinscan-frontend.s3.us-east-1.amazonaws.com \
  --default-root-object index.html \
  --query "Distribution.{Id:Id,DomainName:DomainName}"
```

For full configuration, create `cloudfront-config.json`:

```json
{
  "CallerReference": "skinscan-frontend-dist-1",
  "Comment": "SkinScan AI Frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-skinscan-frontend",
        "DomainName": "skinscan-frontend.s3.us-east-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "<OAC_ID>"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-skinscan-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponseCode": "200",
        "ResponsePagePath": "/index.html",
        "ErrorCachingMinTTL": 0
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}
```

Create Origin Access Control:

```bash
aws cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "skinscan-oac",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }'
```

Then create the distribution:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

> The `CustomErrorResponses` section ensures React Router client-side routing works (all 403/404 paths return `index.html`).

### 2.4 Update S3 Bucket Policy

After getting the CloudFront distribution ID, update the S3 bucket policy (step 2.1) with the actual distribution ARN.

---

## 3. Post-Deployment

### 3.1 Invalidate CloudFront Cache (after each deploy)

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

### 3.2 Verify

- Frontend: `https://<distribution-id>.cloudfront.net`
- API: `https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/register`

### 3.3 Custom Domain (optional)

```bash
# Request certificate in ACM (must be us-east-1 for CloudFront)
aws acm request-certificate \
  --domain-name app.yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# After validation, update CloudFront distribution with:
# - Aliases: ["app.yourdomain.com"]
# - ViewerCertificate.ACMCertificateArn: <certificate-arn>

# Add CNAME in your DNS:
# app.yourdomain.com → <distribution-id>.cloudfront.net
```

---

## 4. CI/CD Quick Deploy Script

Create `deploy.sh` for repeated deployments:

```bash
#!/bin/bash
set -e

API_ID="your-api-id"
DISTRIBUTION_ID="your-distribution-id"
S3_FRONTEND="skinscan-frontend"
REGION="us-east-1"

echo "=== Building frontend ==="
bun run build

echo "=== Uploading to S3 ==="
aws s3 sync dist/ s3://$S3_FRONTEND --delete --region $REGION

echo "=== Invalidating CloudFront ==="
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

echo "=== Deploying Lambdas ==="
cd cloud/lambda
zip register.zip register.py
zip verify_otp.zip verify_otp.py

aws lambda update-function-code --function-name skinscan-register --zip-file fileb://register.zip --region $REGION
aws lambda update-function-code --function-name skinscan-verify-otp --zip-file fileb://verify_otp.zip --region $REGION

rm -f register.zip verify_otp.zip

echo "=== Done ==="
echo "Frontend: https://$DISTRIBUTION_ID.cloudfront.net"
echo "API: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
```

---

## 5. Data Isolation

Every user's data is scoped by their email (primary key):

| Resource | Partition Key | Access Control |
|----------|--------------|----------------|
| DynamoDB `skinscan-users` | `email` | Lambda checks authenticated email |
| S3 `skinscan-user-scans` | Prefix: `{email}/` | Lambda generates pre-signed URLs scoped to user |

Lambda functions must always scope queries and S3 operations to the authenticated user's email, ensuring no cross-user data access.
