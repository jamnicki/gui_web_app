import eel
import cv2
import base64


CAMERA = cv2.VideoCapture()


def open_capture(camera_id=0):
	"""Open the video stream if it's closed."""
	if not CAMERA.isOpened():
		CAMERA.open(0)
		print("Opened the video stream!")
	else:
		print("The video stream is already opened!")

def close_capture():
	"""Close the video stream if it's opened."""
	if CAMERA.isOpened():
		CAMERA.release()
		print("Closed the video stream!")
	else:
		print("The video stream is already closed!")

def get_frame():
	"""Get a camera frame from an opened video stream."""
	response = {'frame': None,
				'error': None}
	try:
		_, frame = CAMERA.read()
		_, buffer = cv2.imencode('.jpg', frame)
		frame_b64 = base64.b64encode(buffer)
		frame_utf8 = frame_b64.decode('utf-8')
		response['frame'] = frame_utf8
	except Exception as e:
		error = f"Couldn't read a frame. Is the video stream closed?\n{e}"
		print(error)
		response['error'] = error
	return response


def stream_frames(fps):
	"""Take and send frames to the frontend continuously."""
	counter = 0
	while CAMERA.isOpened():
		counter += 1
		eel.setFrame(get_frame())
		print(f"Sent the frame to the frontend ({counter})!")
		eel.sleep(1/fps)

def start_sending_frames(fps, camera_id=0):
	"""Initiate sending frames to the frontend continuously."""
	open_capture(camera_id)
	eel.spawn(stream_frames(fps))

def stop_sending_frames():
	"""Stop sending frames to the frontend."""
	close_capture()

def send_single_frame(camera_id=0):
	"""Take and send a single frame to the frontend."""
	open_capture(camera_id)
	eel.setFrame(get_frame())
	close_capture()
