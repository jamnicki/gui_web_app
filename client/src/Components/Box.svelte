<script>
  import { fly } from 'svelte/transition';
</script>

<div transition:fly class="box">
  <slot />
</div>

<style>
  .box {
    border-radius: var(--border-radius);
    background-color: var(--main);
    box-shadow: var(--elevated);
  }
</style>
