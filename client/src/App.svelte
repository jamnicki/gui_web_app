<script>
	let text = '';
	function getText() {
		fetch('/test')
			.then(d => d.text())
			.then(d => (text = d));
	}
</script>

<main>
	<h1>Hello world!</h1>
	<h2>Kiedyś tu będzie GUI</h2>
	<p>{text}</p>
	<button on:click={getText}>Testuj</button>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
	h1 {
		color: #006bcf;
		font-size: 3em;
	}
</style>