<script>
  import { panel, connected, debug } from './stores.js';
  import Login from './Panels/Login.svelte';
  import Tests from './Panels/Tests.svelte';
  import Monitor from './Panels/Monitor.svelte';
  import Loader from './Components/Loader.svelte';

  async function checkConnection() {
    $connected = await eel.check_connection()().connected;
    console.log('Połączenie: ' + Boolean($connected));
  }
  function connect() {
    $connected = 1;
  }
  function disconnect() {
    if (confirm('You will have to login again. Continue?')) {
      $connected = 0;
    }
  }

  $: if ($connected) {
    $panel = 'Tests';
  } else {
    $panel = 'Login';
  }

  async function checkDebugMode() {
    $debug = await eel.debug()();
  }
  checkDebugMode();
</script>

<nav>
  <span class="button" on:click={disconnect}>Login</span>
  {#if $connected}
    {#if $panel == 'Tests' || $panel == 'Monitor'}
      <span>&nbsp;{'>'}&nbsp;</span>
      <span
        class="button"
        on:click={() => {
          $panel = 'Tests';
        }}>Tests</span
      >
    {/if}
    {#if $panel == 'Monitor'}
      <span>&nbsp;{'>'}&nbsp;</span>
      <span
        class="button"
        on:click={() => {
          $panel = 'Monitor';
        }}>Monitor</span
      >
    {/if}
  {/if}
</nav>

<main>
  {#if $panel == 'Login'}
    <Login />
  {:else if $panel == 'Tests'}
    <Tests />
  {:else if $panel == 'Monitor'}
    <Monitor />
  {/if}
</main>

{#if $debug}
  <div class="check-connection">
    {#await $connected}
      <Loader />
    {:then value}
      {#if value}
        <span class="success">Connection alive</span>
      {:else}
        <span class="fail">Connection failed</span>
      {/if}
    {/await}
    <button on:click={checkConnection}>Check</button>
    <button on:click={connect}>Connect</button>
    <button on:click={disconnect}>Disconnect</button>
  </div>
{/if}

<style>
  nav {
    z-index: 100;
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
  }
  nav > .button:hover {
    cursor: pointer;
    font-weight: 900;
    color: var(--accent);
  }

  main {
    width: 100%;
    height: 100%;
  }

  .check-connection {
    z-index: 100;
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .check-connection span {
    margin-right: 10px;
  }
</style>
