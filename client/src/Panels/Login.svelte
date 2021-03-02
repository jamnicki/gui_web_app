<script>
  import { slide } from 'svelte/transition';
  import Box from '../Components/Box.svelte';
  import Loader from '../Components/Loader.svelte';
  
  // Login data
  let hostname;
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
  
  // Login info
  let login_error;
  let login_hint;
  let login_loading = false;


  async function getAddresses() {
    addresses_loading = true;
    const res = await fetch('/available-addresses');
    try {
      const json = await res.json();
      console.log(json);
      if (json.addresses) {
        let new_addresses = json.addresses.filter((elem)=>{
          return !addresses.includes(elem);
        });
        addresses = addresses.concat(new_addresses);
      }
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
      hostname: addresses[hostname],
      username: username,
      password: password
    }
    // filter out empty fields
    data = Object.fromEntries(
      Object.entries(data).filter( (val) => Boolean(val) )
    );
    console.log(JSON.stringify(data));
    const res = await fetch('/connect', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    try {
      const json = await res.json();
      connected = Boolean(json.connected);
      login_error = (json.error) ? json.error : '';
      login_hint = (json.hint) ? json.hint : '';
    } catch (error) {
      login_error = error;
    }
    login_loading = false;
  }

  function handleEnter(e) {
    if (e.key === 'Enter') {
      connect();
    }
  }
</script>


<main>
  <Box>
    <div class="wrapper">

      <div class="address">
        <h3>SSH</h3>
        <select bind:value={hostname}>
          {#each addresses as address, i}
            <option value={i}>{address}</option>
          {/each}
        </select>
        <Loader loading={addresses_loading} success={!addresses_error}
          always_visible={true} type="slash"/>
      </div>
      
      {#if addresses_error}
        <span transition:slide class="message error">{addresses_error}</span>
      {/if}
      {#if addresses_hint}
        <span transition:slide class="message hint">{addresses_hint}</span>
      {/if}

      <form on:keydown={handleEnter}>
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
  select {
    padding: 0;
    margin: 0 10px;
  }

  form {
    margin-top: 40px;
  }

  .login-loader {
    margin-top: 5px;
    text-align: center;
  }

  .message {
    display: block;
    margin-top: 20px;
  }
</style>