import re


def close_file_objects(file_objects):
    """Close all file objects from given list.

    Args:
        file_objects (list): contains file objects to close
    """
    for file in file_objects:
        file.close()


def shorten_exception_message(exception_message_raw):
    """Shortens an exception message so that it contains
       only the most valuable information.

    Args:
        exception_message_raw (str): The original exception message.
    Return (str): Shortened string.
    """

    # All lines in message containing
    # both 'File' and '.py' expressions but not '/python3.'.
    regex_including = re.compile(r'File.+.py.+')
    regex_excluding = re.compile(r'.+/python3..+')
    valuable_lines = regex_including.findall(exception_message_raw)

    for valuable_line in reversed(valuable_lines):
        if re.match(regex_excluding, valuable_line):
            valuable_lines.remove(valuable_line)

    valuable_lines.append(exception_message_raw.splitlines()[-1])

    return '\n'.join(valuable_lines)
