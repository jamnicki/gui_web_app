<script>
  import { fly } from 'svelte/transition';
</script>

<div in:fly={{ delay: 400 }} out:fly class="wrapper">
  <h1>Monitor</h1>
  <img src="tumbleweed.gif" alt="tumbleweed" />
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
    width: 100%;
  }
</style>
