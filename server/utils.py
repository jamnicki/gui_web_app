import os
import sys
import re


def close_file_objects(file_objects):
    """Close all file objects from given list.

    Args:
        file_objects (list): contains file objects to close
    """
    for file in file_objects:
        file.close()


def connection_alive(paramiko_SSHClient):
    """Check if the connection is still availlable.

    Return (bool) : True if it's still alive, False otherwise.
    """
    get_transport = paramiko_SSHClient.get_transport()
    if get_transport is not None:
        if get_transport.is_active():
            return True
    else:
        try:
            paramiko_SSHClient.exec_command('pwd', timeout=5)
        except AttributeError as e:
            print(f'\tConnection lost: session not found ({e})')
            return False
        except Exception as e:
            print(f'Unexpected exception in connection checking: {e}')
            return False
        else:
            return True


def get_static_path(path):
    is_frozen = getattr(sys, 'frozen', False)
    return os.path.join(sys._MEIPASS, path) if is_frozen else path


def shorten_exception_message(exception_message_raw):
    """
    Shortens exception message so it contains only the most valuable informations.

    Args:
        exception_message_raw (str): Whole exception message when one is encountered.
    Return (str): Shortened string.
    """
    
    # All lines in message containing 'File' and '.py' expression and not containing '/python3.' expression.
    regex_including = re.compile(r'File.+.py.+')
    regex_excluding = re.compile(r'.+/python3..+')
    valuable_lines = regex_including.findall(exception_message_raw)

    for valuable_line in reversed(valuable_lines):
        if re.match(regex_excluding, valuable_line):
            valuable_lines.remove(valuable_line)

    valuable_lines.append(exception_message_raw.splitlines()[-1])

    response = '\n'.join(valuable_lines)

    return response
