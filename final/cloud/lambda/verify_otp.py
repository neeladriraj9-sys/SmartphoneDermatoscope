import json
import boto3

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('skinscan-users')


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
        otp_code = body['otp']

        response = users_table.get_item(Key={'email': email})
        if 'Item' not in response:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'User not found'})
            }

        user = response['Item']
        stored_otp = user.get('otp', '')

        if otp_code == stored_otp:
            # Clear OTP after successful verification
            users_table.update_item(
                Key={'email': email},
                UpdateExpression='REMOVE otp'
            )
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'email': email,
                        'name': user.get('name', ''),
                    }
                })
            }
        else:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Invalid OTP code'})
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
