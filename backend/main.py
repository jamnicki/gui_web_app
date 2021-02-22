import re
import subprocess
from flask import Flask, request
from paramiko import SSHClient
from utils import close_file_objects


app = Flask(__name__)
client = SSHClient()


@app.route('/connect/<string:protocol>', methods=['POST'])
def connect_to_ROV(protocol):
    # TODO: error handling, docstring
    response = {'connected': 0,
                'error': None}
    if protocol.lower() == 'ssh':
        client.load_system_host_keys()

        hostname = request.form.get('hostname')
        username = request.form.get('username')
        password = request.form.get('password')

        client.connect(hostname=hostname, username=username, password=password)

    return response


@app.route('/available-addresses', methods=['GET'])
def get_available_addresses():
    """Find available addresses on user's local network
       by executing 'arp -a' command.

    Returns on GET:
        dict:
            'available_addresses' (list): local IP addresses that
                                          matching pattern '192.168.x.x'.
                                          None if not found.
            'error' (str): Exception message if unexpected error occured.
                           None if not.
    """
    response = {'available_addresses': None,
                'error': None}
    try:
        arp = subprocess.run(['arp', '-a'], capture_output=True, text=True)
        regex = re.compile(r'192.168.[0-9]{1,3}.[0-9]{1,3}')
        available_addresses = regex.findall(arp.stdout)
        if available_addresses:
            response['available_addresses'] = available_addresses
    except Exception as e:
        response['error'] = str(e)
        print(f'Exception in {get_available_addresses.__name__}():\n\t{e}')

    return response


if __name__ == '__main__':
    app.run(debug=True)
    client.close()
