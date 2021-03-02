<script>
	import Login from './Panels/Login.svelte';

	async function checkConnection() {
		let res = await fetch('/check-connection');
		let json = await res.json()
		return json.connected;
	}
	let connected = checkConnection();
</script>

<Login/>

<div class="check-connection">
	<button on:click={checkConnection}>Sprawdź</button>
	{#await connected}
		<span class="success">Sprawdzam...</span>
	{:then value} 
		{#if value}
			<span class="success">Połączenie utrzymane</span>
		{:else}
			<span class="fail">Brak połączenia</span>
		{/if}
	{/await}
</div>

<style>
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