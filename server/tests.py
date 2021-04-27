import re
import json
from server.network import CLIENT
from server.settings import CONFIG
from server.utils import (close_file_objects, shorten_exception_message)
from paramiko import ssh_exception


DEBUG = bool(int(CONFIG['DEBUG']['debug']))
DEBUG_TESTS_FAILING = []


def get_tests_info():
    """Get info about available tests by remotely running a dedicated script.

    Returns:
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

    # będzie :)
    if DEBUG:
        for i in range(10):
            test_dict = {'id': i,
                         'script_name': f'test{i}.py',
                         'test_name': f'Test{i} name',
                         'description': f'Test{i} description '*5}

            response['tests_info'].append(test_dict)

        return response

    command = 'python3 get_tests_info.py'
    try:
        stdin, stdout, stderr = CLIENT.exec_command(command)
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


def run_test(id):
    """Run test with given id by executing dedicated script fetched
       from /data/tests.json temporary file.

    Returns:
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
        stdin, stdout, stderr = CLIENT.exec_command(command)
        stdout.channel.recv_exit_status()
        err = stderr.read().decode('utf-8')
        close_file_objects([stdin, stdout, stderr])
    except ssh_exception.SSHException as e:
        print(f'Exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
    except Exception as e:
        print(f'Unexpected exception in {run_test.__name__}():\n\t{e}')
        response['error'] = str(e)
    else:
        if not err:
            response['passed'] = 1
        else:
            response['error_full'] = err
            response['error'] = shorten_exception_message(err)
            print(f"ROV test error:\n{response['error']}")
    finally:
        return response
