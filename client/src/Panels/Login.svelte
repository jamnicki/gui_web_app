<script>
  import { slide, fly } from 'svelte/transition';
  import { connected } from '../stores.js';
  import Loader from '../Components/Loader.svelte';

  // Login data
  let hostname_select;
  let hostname_input;
  $: hostname = addresses_input ? hostname_input : addresses[hostname_select];
  let username;
  let password;

  // Predefined addresses
  let addresses = ['192.168.1.1', '192.168.1.115'];

  // Addresses info
  let addresses_input = false;
  let addresses_error;
  let addresses_hint;
  let addresses_loading = false;

  // Login info
  let login_error;
  let login_hint;
  let login_loading = false;

  async function getAddresses() {
    addresses_loading = true;
    // Get data
    try {
      const res = await fetch('/available-addresses');
      const json = await res.json();
      if (json.addresses) {
        // Filter out addresses that are already on the list
        const new_addresses = json.addresses.filter((elem) => {
          return !addresses.includes(elem);
        });
        // Combine the old and new addresses
        addresses = addresses.concat(new_addresses);
      }
      // Replace Errors and Hints if there are new ones or empty them
      addresses_error = json.error || '';
      addresses_hint = json.hint || '';
    } catch (error) {
      addresses_error = error;
    }
    addresses_loading = false;
  }
  getAddresses();

  async function login() {
    login_loading = true;
    // Handle empty inputs
    if (hostname == '') hostname = undefined;
    if (username == '') username = undefined;
    if (password == '') password = undefined;
    // Send data
    try {
      const res = await fetch('/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: hostname,
          username: username,
          password: password,
        }),
      });
      const json = await res.json();
      $connected = json.connected;
      login_error = json.error || '';
      login_hint = json.hint || '';
    } catch (error) {
      login_error = error;
    }
    login_loading = false;
  }

  function handleEnter(e) {
    if (e.key === 'Enter') connect();
  }
</script>

<div in:fly={{ delay: 400 }} out:fly class="wrapper">
  <div class="login" on:keydown={handleEnter}>
    <div class="address">
      <Loader
        loading={addresses_loading}
        success={!addresses_error}
        always_visible={true}
      />
      <h3>SSH</h3>
      {#if !addresses_input}
        <select bind:value={hostname_select}>
          {#each addresses as address, i}
            <option value={i}>{address}</option>
          {/each}
        </select>
      {:else}
        <input type="text" bind:value={hostname_input} />
      {/if}
      {#if !addresses_input}
        <div
          class="addresses-action"
          on:click={() => {
            addresses_input = true;
          }}
        >
          <img src="icon/edit.svg" alt="input" />
        </div>
      {:else}
        <div
          class="addresses-action"
          on:click={() => {
            addresses_form = 'SELECT';
          }}
        >
          <img src="icon/list.svg" alt="select" />
        </div>
      {/if}
      <div class="addresses-action" on:click={getAddresses}>
        <img src="icon/refresh.svg" alt="select" />
      </div>
    </div>

    {#if addresses_error}
      <span transition:slide class="message error">{addresses_error}</span>
    {/if}
    {#if addresses_hint}
      <span transition:slide class="message hint">{addresses_hint}</span>
    {/if}

    <form>
      <label
        >Username
        <input type="text" bind:value={username} />
      </label>
      <label
        >Password
        <input type="password" bind:value={password} />
      </label>
      <input type="submit" value="Login" on:click|preventDefault={login} />
      <div class="login-loader">
        <Loader type="dots" loading={login_loading} />
      </div>
    </form>

    {#if $connected}
      <div transition:slide class="message success">Connected!</div>
    {/if}
    {#if login_error}
      <div transition:slide class="message error">{login_error}</div>
    {/if}
    {#if login_hint}
      <div transition:slide class="message hint">{login_hint}</div>
    {/if}
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  .login {
    border-radius: var(--border-radius);
    padding: 40px 200px;
    width: 700px;
    background-color: var(--main);
  }

  input {
    width: 100%;
  }

  .address {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .address > * {
    margin: 0 5px;
  }
  .address > select {
    width: 140px;
    padding: 0 5px;
  }
  .address > input {
    width: 140px;
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
    display: flex;
    justify-content: center;
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .message {
    display: block;
    margin-top: 20px;
  }
</style>
