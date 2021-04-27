import configparser


PATH = 'server/settings.ini'


def read_config():
	config = configparser.ConfigParser()
	config.read(PATH)
	print(config)
	return config


CONFIG = read_config()
