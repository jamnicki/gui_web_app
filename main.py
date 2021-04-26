import sys
import re
import json
import time
import cv2
import base64
import eel
import platform
import subprocess

from paramiko import SSHClient, ssh_exception, AutoAddPolicy
from server.utils import (connection_alive, close_file_objects,
                          shorten_exception_message)

from datetime import datetime as dtime


DEBUG = True
DEBUG_TESTS_FAILING = []

SIZE = (200, 100)
POSITION = (300, 50)

system = platform.system()
client = SSHClient()
camera = cv2.VideoCapture()


def open_capture(camera_id=0):
    """Open the video stream if it's closed."""
    global camera
    if not camera.isOpened():
        camera.open(0)
        print("Opened the video stream!")
    else:
        print("Video stream is already opened!")


def close_capture():
    """Close the video stream if it's opened."""
    global camera
    if camera.isOpened():
        camera.release()
        print("Closed the video stream!")
    else:
        print("Video stream is already closed!")


def get_frame():
    """Get a camera frame from an opened video stream."""
    response = {'frame': None,
                'error': None}
    global camera
    try:
        _, frame = camera.read()
        _, buffer = cv2.imencode('.jpg', frame)
        frame_b64 = base64.b64encode(buffer)
        frame_utf8 = frame_b64.decode('utf-8')
        response['frame'] = frame_utf8
    except Exception as e:
        error_message = f"Could not read a frame. Is the video\
            stream closed?\n{e}"
        print(error_message)
        response['error'] = error_message
    return response


def stream_frames(fps):
    """Take and send frames to the frontend continuously."""
    global camera
    frames_counter = 0
    while camera.isOpened():
        frames_counter += 1
        eel.setFrame(get_frame())
        print(f"Sent the frame to the frontend ({frames_counter})!")
        eel.sleep(1/fps)


def on_exit(page_path, websockets):
    print("""
    The app was closed! 🛑
    Shutting down the SSH client...
    """)
    client.close()
    sys.exit()


@eel.expose
def debug():
    """Check if in DEBUG MODE"""
    return int(DEBUG)


@eel.expose
def loader():
    """Delay the return to test loading animations"""
    time.sleep(5)
    return 'Loader test response.'


@eel.expose
def connect(hostname, username, password):
    """Connect to ROV via SSH using hostname, username and password
       from POST request received data.
    """
    # TODO: docstring, hints baseing on exceptions, ?hint database?
    response = {'connected': 0,
                'error': None,
                'hint': None}

    if not hostname or not username or not password:
        print('Missing hostname, username or password.')

    # Secret passage. For debugging.
    if username == 'conn' and password == 'conn':
        response['connected'] = 1
        return response

    try:
        client.set_missing_host_key_policy(AutoAddPolicy)
        client.load_system_host_keys()
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    try:
        client.connect(hostname=hostname, username=username, password=password,
                       timeout=15)
    except ssh_exception.AuthenticationException as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = '''Check if the entered username or password
                              is correct.'''
        return response
    except ssh_exception.NoValidConnectionsError as e:
        print(f'Exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Try different IP.'
        return response
    except OSError as e:
        if e.errno == 101:
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Network is unreachable'
            response['hint'] = '''Check your network connection status. Connection type
                                  must be the same for both of sides!'''
            return response
        elif e.__class__.__name__ == 'timeout':
            # equivalent of 'socket.timeout' which is OSError by itself
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Connection timed out.'
            return response
        else:
            print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
            response['error'] = str(e)
            return response
    except TimeoutError as e:
        if e.errno == 110:
            print(f'Exception in {connect.__name__}():\n\t{e}')
            response['error'] = 'Connection timed out.'
            return response
        else:
            print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
            response['error'] = str(e)
            return response
    except Exception as e:
        print(f'Unexpected exception in {connect.__name__}():\n\t{e}')
        response['error'] = str(e)
        response['hint'] = 'Oopsie Woopsie\nNie wiem\nIdź pobiegać? xd'
    else:
        response['connected'] = 1

    return response


@eel.expose
def check_connection():
    response = {'connected': 0}

    if connection_alive(client):
        response['connected'] = 1

    return response


@eel.expose
def get_available_addresses():
    """Find available addresses on user's local network
       by executing 'arp -a' command.
       If on linux scan only on [ssh_port] in [scan_range] using 'pnscan'.

    Returns on GET:
        dict:
            'addresses' (list): local IP addresses that
                                matching pattern '192.168.x.x'.
                                None if not found.
            'error' (str): Exception message if an unexpected error occured.
                           None if not.
    """
    response = {'addresses': [],
                'error': None,
                'hint': None}
    try:
        if system == 'Linux':
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
            scan_report = subprocess.run(['arp', '-a'], capture_output=True,
                                         text=True)
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


@eel.expose
def get_tests_info():
    """Get info about available tests by remotely running a dedicated script.

    Returns on GET:
        dict:
            'tests_info' (list of dicts):
                {'id' (int): Unique test id.
                'script_name' (str): Tests filename.
                'test_name' (str): Tests name.
                'description' (str): Short description of the test.}, ...
            'error' (str):	Exception message if an unexpected error occured.
                            None if not.
    """
    response = {'tests_info': [],
                'error': None}

    # Jokes aside, I need something of a mockup script, that would simulate the
    # behaviours of the real boat. Maybe create a /mockup folder in the root
    # and have a main.py script there. And the scripts here would use the
    # mockup with some variable like MOCKUP set to True. We need something like
    # this while the real boat's scripts are still in dev.
    if DEBUG:
        response['tests_info'] = [
            {'id': 1,
             'script_name': 'fuck_you.py',
             'test_name':   'Fuck you',
             'description': 'Just go fuck yourselves'},
            {'id': 2,
             'script_name': 'ehh.py',
             'test_name':   'This is not my job',
             'description': 'Why am I doing this'},
            {'id': 3,
             'script_name': 'god_dammit.py',
             'test_name':   'Fucking backend devs',
             'description': 'Always have to do everyting by myself'},
            {'id': 4,
             'script_name': 'millenials.py',
             'test_name':   'Millenials these days',
             'description': 'Can you start thinking of stuff like this?'},
            {'id': 5,
             'script_name': 'just.py',
             'test_name':   'Like fuck dammit',
             'description': 'Where am I supposed to find fucking boat tests\
                 huh? What the fuck.'},
            {'id': 6,
             'script_name': 'like.py',
             'test_name':   'Like am i supposed to',
             'description': 'Go to a fucking shop and ask for a boat?'},
            {'id': 7,
             'script_name': 'jesus.py',
             'test_name':   'Fuck do you even',
             'description': 'Know how much it costs to buy a fucking boat?'},
            {'id': 8,
             'script_name': 'yeah.py',
             'test_name':   'Thats what I thot',
             'description': 'Hehe get it.'},
            {'id': 9,
             'script_name': 'okay.py',
             'test_name':   'Im done',
             'description': 'Like fucking done how do I work like this.\
                 Get me a goddamn mockup boat.'}
        ]
        return response

    command = 'python3 get_tests_info.py'
    try:
        stdin, stdout, stderr = client.exec_command(command)
        stdout.channel.recv_exit_status()
        tests_info_output = stdout.read().decode('utf-8')
        regex = re.compile(r'\{.+\}')
        matches = re.findall(regex, tests_info_output)
        close_file_objects([stdin, stdout, stderr])
    except ssh_exception.SSHException as e:
        print(f'Exception in {get_tests_info.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response
    except Exception as e:
        print(f'Unexpected exception in {get_tests_info.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    for match in matches:
        j = json.loads(match)
        response['tests_info'].append(j)

    # Save tests to json file
    test_data = {}
    for test in response['tests_info']:
        test_copy = test.copy()
        del test_copy['id']
        test_data[test['id']] = test_copy

    with open('server/data/tests.json', 'w') as f:
        json.dump(test_data, f, indent=4, ensure_ascii=False)
    # -----------------------------------------------------------

    return response


@eel.expose
def run_test(id):
    """Run test with given id.

    Returns on GET:
        dict:
            'passed' (int): 1 if test passed.
                            0 if not.
            'error' (str):	Exception message if an unexpected error occurred.
                            None if not.
    """
    response = {'passed': 0,
                'error': None}

    if DEBUG:
        if id not in DEBUG_TESTS_FAILING:
            response['passed'] = 1
        else:
            response['error'] = 'Our programmers are working day and night to\
                solve this issue. Stay still. Stay positive. Hydrate yourself.'
        return response

    path = "server/data/tests.json"
    with open(path, 'r') as json_file:
        test_data = json.load(json_file)

    try:
        current_test = test_data[str(id)]
    except KeyError as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    try:
        script_name = current_test['script_name']
        module_name = script_name.split('.')[0]
    except KeyError as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response

    command = f'python3 -m tests.{module_name} run'
    try:
        stdin, stdout, stderr = client.exec_command(command)
        stdout.channel.recv_exit_status()
        err = stderr.read().decode('utf-8')
        close_file_objects([stdin, stdout, stderr])
    except ssh_exception.SSHException as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response
    except Exception as e:
        print(f'Unexpected exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
        return response
    else:
        if not err:
            response['passed'] = 1
        else:
            response['error_full'] = err
            response['error'] = shorten_exception_message(err)
            print(f"ROV test error:\n{response['error']}")

    return response


@eel.expose
def start_sending_frames(fps, camera_id=0):
    """Initiate sending frames to the frontend continuously."""
    open_capture(camera_id)
    eel.spawn(stream_frames(fps))


@eel.expose
def stop_sending_frames():
    """Stop sending frames to the frontend."""
    close_capture()


@eel.expose
def send_single_frame(camera_id=0):
    """Take and send a single frame to the frontend."""
    open_capture(camera_id)
    eel.setFrame(get_frame())
    close_capture()


if __name__ == '__main__':
    print("""
    The app is running! 🚀
    Local:  http://localhost:8000/
    """)
    geometry = {'size': SIZE, 'position': POSITION}
    eel.init('client/public')
    eel.start('index.html', geometry=geometry, close_callback=on_exit)
