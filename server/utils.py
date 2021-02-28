def close_file_objects(file_objects):
    """Close all file objects from given list.

    Args:
        file_objects (list): contains file objects to close
    """
    for file in file_objects:
        file.close()
