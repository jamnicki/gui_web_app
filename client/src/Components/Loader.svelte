<script>
  import { onMount, onDestroy } from 'svelte';

  export let type = '.';

  let loop;
  let loader = type;

  onMount(() => {
    loop = setInterval(()=>{
      if (type == '/') {
        
        if(loader == '/') {
          loader = '\\'
        } else {
          loader = '/'
        }

      } else { // dots
        
        loader += '.';
        if (loader.length > 3) {
          loader = '.';
        }

      }
    }, 400);
  })

  onDestroy(() => {
    clearInterval(loop);
  })
</script>

<span>{@html loader}</span>