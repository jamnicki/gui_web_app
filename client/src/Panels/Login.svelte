<script>
  import { slide } from 'svelte/transition';
  import Box from '../Components/Box.svelte';
  import Loader from '../Components/Loader.svelte';
  
  // Login data
  let hostname_select;
  let hostname_input;
  let username;
  let password;

  // Predefined addresses
  let addresses = [
    '192.168.1.1',
    '192.168.1.115'
  ]
  
  // SSH Connection status
  let connected = 0;
  
  // Obtaining addresses info
  let addresses_error;
  let addresses_hint;
  let addresses_loading = false;
  let addresses_form = 'SELECT';
  
  // Login info
  let login_error;
  let login_hint;
  let login_loading = false;


  async function getAddresses() {
    addresses_loading = true;
    // Get data
    const res = await fetch('/available-addresses');
    try {
      const json = await res.json();
      if (json.addresses) {
        // Filter out addresses that are already on the list
        let new_addresses = json.addresses.filter((elem)=>{
          return !addresses.includes(elem);
        });
        // Combine the old and new addresses
        addresses = addresses.concat(new_addresses);
      }
      // Replace Errors and Hints if there are new ones or empty them
      addresses_error = (json.error) ? json.error : '';
      addresses_hint = (json.hint) ? json.hint : '';
    } catch (error) {
      addresses_error = error;
    }
    addresses_loading = false;
  }
  getAddresses()
  

  async function login() {
    login_loading = true;
    let data = {
      // Load hostname from Select or Input field
      hostname: (addresses_form == 'SELECT')
        ? addresses[hostname_select] : hostname_input,
      username: username,
      password: password
    }
    // Filter out empty fields
    for (let key in data) {
      if (data[key] === '') {
        data[key] = undefined;
      }
    }
    console.log(JSON.stringify(data));
    // Send data
    const res = await fetch('/connect', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    try {
      const json = await res.json();
      connected = Boolean(json.connected);
      // Replace Errors and Hints if there are new ones or empty them
      login_error = (json.error) ? json.error : '';
      login_hint = (json.hint) ? json.hint : '';
    } catch (error) {
      login_error = error;
    }
    login_loading = false;
  }

  function handleEnter(e) {
    if (e.key === 'Enter') connect();
  }
</script>


<main>
  <Box on:keydown={handleEnter}>
    <div class="wrapper">

      <div class="address">
        <Loader loading={addresses_loading} success={!addresses_error}
            always_visible={true} type="slash"/>
        <h3>SSH</h3>
        {#if addresses_form == 'SELECT'}
          <select bind:value={hostname_select}>
            {#each addresses as address, i}
              <option value={i}>{address}</option>
            {/each}
          </select>
        {:else if addresses_form == 'INPUT'}
          <input type="text" bind:value={hostname_input}>
        {/if}
        {#if addresses_form == 'SELECT'}
          <span class="addresses-action"
              on:click={()=>{ addresses_form = 'INPUT' }}>M</span>
        {:else if addresses_form == 'INPUT'}
          <span class="addresses-action"
              on:click={()=>{ addresses_form = 'SELECT' }}>S</span>
        {/if}
        <span class="addresses-action" on:click={getAddresses}>R</span>
      </div>
      
      {#if addresses_error}
        <span transition:slide class="message error">{addresses_error}</span>
      {/if}
      {#if addresses_hint}
        <span transition:slide class="message hint">{addresses_hint}</span>
      {/if}

      <form>
        <label>Username
          <input type="text" bind:value={username}>
        </label>
        <label>Password
          <input type="password" bind:value={password}>
        </label>
        <input type="submit" value="Login"
            on:click|preventDefault={login}>
        <div class="login-loader">
          <Loader type="dots" loading={login_loading}/>
        </div>
      </form>

      {#if connected}
        <div transition:slide class="message success">Połączono!</div>
      {/if}
      {#if login_error}
        <div transition:slide class="message error">{login_error}</div>
      {/if}
      {#if login_hint}
        <div transition:slide class="message hint">{login_hint}</div>
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

  input {
    width: 100%;
  }

  .wrapper {
    width: 250px;
  }
  .address {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .address * {
    margin: 0 5px;
  }
  select {
    min-width: 140px;
    padding: 0 5px;
  }
  .address > input {
    min-width: 140px;
    padding: 1px 8px;
  }

  form {
    margin-top: 40px;
  }

  .login-loader {
    margin-top: 5px;
    text-align: center;
  }

  .addresses-action {
    cursor: pointer;
  }

  .message {
    display: block;
    margin-top: 20px;
  }
</style>