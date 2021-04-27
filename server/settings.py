import configparser


PATH = 'server/settings.ini'


def read_config():
    config = configparser.ConfigParser()
    config.read(PATH)
    return config


CONFIG = read_config()
