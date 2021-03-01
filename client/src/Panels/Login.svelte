<script>
  import { slide } from 'svelte/transition';
  import Box from '../Components/Box.svelte';
  import Loader from '../Components/Loader.svelte';
  
  let error;
  let hint;

  // Connecting

  let hostname;
  let username;
  let password;
  
  let waitingForConnection = false;

  let connected;
  
  async function connect() {
    waitingForConnection = true;
    const res  = await fetch('/connect', {
      method: 'POST',
      body: {
        'hostname': hostname,
        'username': username,
        'password': password
      }
    });
    const data = await res.json();
    if (data.error) {
      error = data.error;
    }
    if (data.hint) {
      hint = data.hint;
    }
    waitingForConnection = false;
    connected = data.connected;
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      connect();
    }
  }

  // Loading addresses

  let addresses = [
    '192.168.1.1',
    '192.168.1.151'
  ];
  
  let waitingForAddresses = false;

  async function getAddresses() {
    waitingForAddresses = true;
    const res  = await fetch('/available-addresses');
    const data = await res.json();
    addresses = data.available_addresses;
    if (data.error) {
      error = data.error;
    }
    if (data.hint) {
      hint = data.hint;
    }
    waitingForAddresses = false;
  }

  getAddresses();
</script>

<main>
  <Box on:keydown={handleKeydown}>
    <div class="wrapper">

      <div class="address">
        <h3>SSH</h3>
        <select name="addresses" bind:value={hostname}>
          {#each addresses as address, i}
            <option value={i}>{address}</option>
          {/each}
        </select>
        {#if waitingForAddresses}
          <Loader type={'/'}/>
        {/if}
      </div>
    
      <form>
        <label>
          Username
          <input type="text" bind:value={username}>
        </label>
        <label>
          Password
          <input type="password" bind:value={password}>
        </label>
        <input type="submit" value="Login"
          on:click|preventDefault={()=>{ connect() }}>
        {#if waitingForConnection}
          <span class="connect-loader"><Loader/></span>
        {:else}
          <span class="connect-loader">&nbsp;</span>
        {/if}
      </form>
      {#if connected}
        <span transition:slide class="success">Połączono</span>
      {/if}
      {#if error}
        <span transition:slide class="error error-message">{error}</span>
      {/if}
      {#if hint}
        <span transition:slide class="hint">{hint}</span>
      {/if}

    </div>
  </Box>
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .wrapper {
    width: 250px;
  }
  .address {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 40px;
  }

  input {
    width: 100%;
  }
  select {
    padding: 0;
    margin: 0 10px;
  }

  .connect-loader {
    display: block;
    margin-top: 5px;
    text-align: center;
  }
  .error-message {
    display: block;
    margin-top: 10px;
  }
  .hint {
    display: block;
    margin-top: 10px;
  }
</style>