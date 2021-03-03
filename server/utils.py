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
            print(f'Connection lost: session not found ({e})')
            return False
        else:
            return True
