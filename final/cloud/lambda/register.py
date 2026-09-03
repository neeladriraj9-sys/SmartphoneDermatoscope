import json
import boto3
import uuid
from datetime import datetime
import secrets
import string
import functools

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('skinscan-users')
ses = boto3.client('ses')

@functools.lru_cache(maxsize=1)
def get_frappe_api_token():
    """Fetch Frappe API token from Secrets Manager."""
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(
        SecretId='arn:aws:secretsmanager:us-east-1:976193236457:secret:opencrm/frappe-api-key-iQgSaZ'
    )
    secret = response['SecretString'].strip()
    if secret.startswith('token '):
        return secret
    return f'token {secret}'


def lambda_handler(event, context):
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    try:
        body = json.loads(event['body'])
        email = body['email']
        name = body['name']
        mobile = body.get('mobile', '')

        import random
        otp = str(random.randint(100000, 999999))

        # Trigger n8n webhook for CRM integration and OTP email
        try:
            import urllib3
            http = urllib3.PoolManager()
            n8n_payload = {
                'first_name': name.split()[0] if name.split() else name,
                'last_name': ' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
                'email': email,
                'mobile': mobile,
                'organization': 'SkinScan',
                'action': 'create_lead',
                'otp': otp,
                'send_otp': True
            }
            n8n_response = http.request(
                'POST',
                'https://n8n.digitransolutions.in/webhook/digitranva-lead-intake',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': get_frappe_api_token()
                },
                body=json.dumps(n8n_payload)
            )
            print(f"[n8n] webhook status: {n8n_response.status}")
        except Exception as n8n_err:
            print(f"[n8n] webhook failed: {n8n_err}")

        # Check if user exists
        response = users_table.get_item(Key={'email': email})
        if 'Item' in response:
            # Update existing user with new OTP
            users_table.update_item(
                Key={'email': email},
                UpdateExpression='SET otp = :otp, #n = :name',
                ExpressionAttributeValues={':otp': otp, ':name': name},
                ExpressionAttributeNames={'#n': 'name'}
            )
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'requiresOtp': True,
                    'message': 'OTP sent to your email'
                })
            }

        # New user
        users_table.put_item(Item={
            'email': email,
            'name': name,
            'mobile': mobile,
            'otp': otp,
            'created_at': datetime.utcnow().isoformat(),
        })

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'requiresOtp': True,
                'message': 'Please check your email for OTP verification code'
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
