import re
import subprocess
import platform
from server.settings import CONFIG
from paramiko import SSHClient, ssh_exception, AutoAddPolicy


DEBUG = bool(CONFIG['DEBUG']['debug'])

SYSTEM = platform.system()
CLIENT = SSHClient()


def connect(hostname, username, password):
    """Connect to ROV via SSH using hostname, username and password
       received from the frontend.
    """
    response = {'connected': 0,
                'error': None,
                'hint': None}

    if not hostname or not username or not password:
        print('Missing hostname, username or password.')

    # Secret passage.
    if DEBUG and username == 'conn' and password == 'conn':
        response['connected'] = 1
        return response

    try:
        CLIENT.set_missing_host_key_policy(AutoAddPolicy)
        CLIENT.load_system_host_keys()
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    try:
        CLIENT.connect(hostname=hostname, username=username,
                       password=password, timeout=15)
    except ssh_exception.AuthenticationException as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Check if the entered \
            username or password is correct.'
    except ssh_exception.NoValidConnectionsError as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Try different IP.'
    except OSError as e:
        if e.errno == 101:
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Network is unreachable'
            response['hint'] = 'Check your network connection status. \
                Connection type must be the same for both of sides!'
        elif e.__class__.__name__ == 'timeout':
            # equivalent of 'socket.timeout' which is OSError by itself
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Connection timed out.'
        else:
            print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
            response['error'] = str(e)
    except TimeoutError as e:
        if e.errno == 110:
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Connection timed out.'
        else:
            print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
            response['error'] = str(e)
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Oopsie Woopsie\nNie wiem\nIdź pobiegać? xd'
    else:
        response['connected'] = 1
    finally:
        return response


def connection_alive():
    """Check if the connection is still available.

    Return (bool) : True if it's still alive, False otherwise.
    """
    get_transport = CLIENT.get_transport()
    if get_transport is not None:
        if get_transport.is_active():
            return True
    else:
        try:
            CLIENT.exec_command('pwd', timeout=5)
        except AttributeError as e:
            print(f'\tConnection lost: session not found ({e})')
            return False
        except Exception as e:
            print(f'Unexpected exception in connection checking: {e}')
            return False
        else:
            return True


def check_connection():
    response = {'connected': 0}

    if connection_alive():
        response['connected'] = 1

    return response


def get_available_addresses():
    """Find available addresses on the local network with 'arp -a' command.
       If on linux scan only on [ssh_port] in [scan_range] using 'pnscan'.

    Returns:
        dict:
            'addresses' (list): local IP addresses that match
                                this pattern: 192.168.x.x
                                None if not found.
            'error' (str): Exception message if an unexpected error occured.
                           None if not.
    """
    response = {'addresses': [],
                'error': None,
                'hint': None}

    try:
        if SYSTEM == 'Linux':
            scan_range = '192.168.0.0:192.168.1.255'
            ssh_port = '22'
            try:
                scan_report = subprocess.run(['pnscan', scan_range, ssh_port],
                                             capture_output=True, text=True)
            except FileNotFoundError as e:
                print('"pnscan" required.\n\tTry "sudo apt install pnscan"')
                response['error'] = str(e)
                response['hint'] = 'Try "sudo apt install pnscan".'
                return response
        else:
            scan_report = subprocess.run(['arp', '-a'],
                                         capture_output=True, text=True)
        regex = re.compile(r'192.168.[0-9]{1,3}.[0-9]{1,3}')
        available_addresses = regex.findall(scan_report.stdout)
        if available_addresses:
            response['addresses'] = available_addresses
        else:
            response['error'] = 'No addresses found.'
    except Exception as e:
        response['error'] = str(e)
        print(f'Unexpected exception in {get_available_addresses.__name__}(): \
            \n\t{e}')

    return response
