<div class="box">
  <slot />
</div>

<style>
  .box {
    border-radius: var(--border-radius);
    padding: 40px 200px;
    min-width: 700px;
    background-color: var(--main);
    box-shadow: var(--elevated);
  }
</style>
