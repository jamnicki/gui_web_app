import re


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
