import re
from server.network import CLIENT
from server.settings import CONFIG
from server.utils import (close_file_objects, shorten_exception_message)


DEBUG = bool(CONFIG['DEBUG']['debug'])
DEBUG_TESTS_FAILING = []


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
             'description': 'Where am I supposed to find fucking boat tests \
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
             'description': 'Like fucking done how do I work like this. \
                Get me a goddamn mockup boat.'}
        ]
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
