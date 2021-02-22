import re
import subprocess
from flask import Flask, request
from paramiko import SSHClient
from utils import close_file_objects


app = Flask(__name__)
client = SSHClient()


@app.route('/connect/ssh', methods=['GET', 'POST'])
def connect_ssh():
    # TODO: error handling, docstring
    if request.method == 'POST':
        client.load_system_host_keys()

        hostname = request.form.get('hostname')
        username = request.form.get('username')
        password = request.form.get('password')

        client.connect(hostname=hostname, username=username, password=password)

        return {}


@app.route('/available-addresses/<string:system>', methods=['GET', 'POST'])
def get_available_addresses(system):
    # TODO: error handling
    """Find available addresses on local network basing on user's system.

    Args:
        system (str): URL parameter. User's sytem info.
                      Needed to execute right command.

    Returns:
        dict: Contains list of local IP addresses that
              matching pattern (192.168.x.x)
    """
    if request.method == 'GET':
        if 'linux' in system.lower():
            arp = subprocess.run(['arp', '-a'], capture_output=True, text=True)
            regex = re.compile(r'192.168.[0-9]{1,3}.[0-9]{1,3}')

            available_addresses = regex.findall(arp.stdout)

            return {'available_addresses': available_addresses}


if __name__ == '__main__':
    app.run(debug=True)
    client.close()
