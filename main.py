import sys
import eel
import server.network as network
import server.tests as tests
import server.video as video
from server.network import CLIENT
from server.settings import CONFIG


DEBUG = bool(int(CONFIG['DEBUG']['debug']))

WINDOW_SIZE = tuple(CONFIG['WINDOW']['size'])
WINDOW_POSITION = tuple(CONFIG['WINDOW']['position'])


@eel.expose
def debug():
    """Check if in DEBUG MODE"""
    return int(DEBUG)


eel.expose(tests.get_tests_info)
eel.expose(tests.run_test)

eel.expose(network.connect)
eel.expose(network.check_connection)
eel.expose(network.get_available_addresses)

eel.expose(video.send_single_frame)
eel.expose(video.start_sending_frames)
eel.expose(video.stop_sending_frames)


def on_exit(page_path, websockets):
    print("""
    The app was closed! 🛑
    Shutting down the SSH client...
    """)
    CLIENT.close()
    sys.exit()


if __name__ == '__main__':
    print(f"""
    The app is running! 🚀
    Local:  http://localhost:8000/
    DEBUG = {DEBUG}
    """)
    geometry = {'size': WINDOW_SIZE, 'position': WINDOW_POSITION}
    eel.init('client/public')
    eel.start('index.html', geometry=geometry, close_callback=on_exit)
