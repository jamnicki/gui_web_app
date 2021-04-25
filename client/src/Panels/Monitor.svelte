<script>
  import { fly, slide } from 'svelte/transition';
  import { onDestroy } from 'svelte';

  let video_visible = false;
  let video_frame;
  let video_error;

  eel.expose(setFrame);
  function setFrame(json) {
    console.log(json);
    if (!json.error) {
      video_frame = json.frame;
    }
    // Replace Errors if there are new ones or empty them
    video_error = json.error || '';
  }

  function startVideoStream() {
    console.log('Starting the video stream...');
    video_visible = true;
    eel.start_sending_frames(30)();
  }
  async function stopVideoStream() {
    console.log('Stopping the video stream...');
    await eel.stop_sending_frames()();
    video_visible = false;
  }

  async function getSingleFrame() {
    console.log('Getting a single frame...');
    await eel.send_single_frame()();
    video_visible = true;
  }

  onDestroy(() => {
    stopVideoStream();
  });
</script>

<div in:fly={{ y: 50, delay: 400 }} out:fly={{ y: 50 }} class="wrapper">
  <h1>Monitor</h1>
  <div class="buttons">
    <button on:click={getSingleFrame} class="single">Get a single frame</button>
    <br />
    <button on:click={startVideoStream} class="success"
      >To już się kameruje!!!</button
    >
    <button on:click={stopVideoStream} class="error">Ała kurwaa!!!!</button>
  </div>
  {#if video_error}
    <span transition:slide class="message error">{video_error}</span>
  {/if}
  <div class="video">
    {#if video_visible}
      <img src="data:image/jpg;base64, {video_frame}" alt="video stream" />
    {:else}
      <img src="tumbleweed.gif" alt="tumbleweed" />
    {/if}
  </div>
</div>

<style>
  .wrapper {
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    padding: 100px 0;
    width: 700px;
    min-height: 100%;
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
  img {
    display: block;
    width: 100%;
  }

  .buttons {
    text-align: center;
  }
  .single {
    margin-bottom: 5px;
  }

  .video {
    margin-top: 20px;
  }

  .message {
    margin-top: 10px;
  }
</style>
