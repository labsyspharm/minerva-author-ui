''' aws credentiasl as query params '''
import os
import json


def make_credentials():
    ''' parse results of aws command '''
    response = os.popen('aws sts get-session-token').read()
    credentials = json.loads(response)['Credentials']

    for k in ['SessionToken', 'AccessKeyId', 'SecretAccessKey']:
        yield "{0}={1}".format(k.upper(), credentials[k])

content = list(make_credentials())

with open('.env', 'w') as env:
    for line in content:
        env.write(line+'\n')
