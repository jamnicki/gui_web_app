<script>
	import Login from './Panels/Login.svelte';
	import Tests from './Panels/Tests.svelte';
	import Monitor from './Panels/Monitor.svelte';

	let connected = checkConnection();
	let panel = 'Login'; // Login, Tests, Monitor

	async function checkConnection() {
		let res = await fetch('/check-connection');
		let json = await res.json()
		console.log('Połączenie: '+Boolean(json.connected));
		return json.connected;
	}
</script>


<nav>
	<button disabled={ panel == 'Login' }
			on:click={()=>{ panel = 'Login' }}>Login</button>
	<button disabled={ panel == 'Tests' }
			on:click={()=>{ panel = 'Tests' }}>Tests</button>
	<button disabled={ panel == 'Monitor' }
			on:click={()=>{ panel = 'Monitor' }}>Monitor</button>
</nav>

<div class="check-connection">
	<button on:click={()=>{ connected = checkConnection() }}>Sprawdź</button>
	{#await connected}
		<span class="loading">Sprawdzam...</span>
	{:then value} 
		{#if value}
			<span class="success">Połączenie utrzymane</span>
		{:else}
			<span class="fail">Brak połączenia</span>
		{/if}
	{/await}
</div>

<main>
	<Login/>
	<Tests/>
	<Monitor/>
</main>


<style>
	nav {
		position: fixed;
		top: 70px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
	}
	nav button {
		margin: 0 5px;
	}

	main {
		width: 100%;
		height: 100%;
	}

	.check-connection {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
	}
	.check-connection span {
		margin-left: 10px;
	}
</style>
