<script>
  import { fly, slide } from 'svelte/transition';
  import Loader from '../Components/Loader.svelte';
  import Box from '../Components/Box.svelte';

  // Obtaining tests info
  let tests = [];
  let tests_error;
  let tests_loading = false;

  $: any_test_running = (() => {
    for (let test of tests) {
      if (test.running) {
        return true;
      }
    }
    return false;
  })();

  async function getTests() {
    tests_loading = true;
    // Get data
    const res = await fetch('/tests/info-all');
    try {
      const json = await res.json();
      if (!json.error) {
        // Additional fields intended for running tests
        for (let test of json.tests_info) {
          test.running = false;
          test.passed = -1;
          test.error = '';
        }
        tests = json.tests_info;
      }
      // Replace Errors if there are new ones or empty them
      tests_error = json.error ? json.error : '';
    } catch (error) {
      tests_error = error;
    }
    tests_loading = false;
  }
  getTests();

  async function testRun(i) {
    let test = tests[i];
    console.log(`Running test number ${test.id}`);
    test.running = true;
    tests = tests;
    // Get data
    const res = await fetch(`/tests/run/${test.id}`);
    try {
      const json = await res.json();
      test.passed = json.passed;
      // Replace Errors if there are new ones or empty them
      test.error = json.error ? json.error : '';
    } catch (error) {
      test.error = error;
    }
    test.running = false;
    tests = tests;
  }

  function runAllTests() {
    console.log('Running all tests...');
    for (let i in tests) {
      testRun(i);
    }
  }
</script>

<div in:fly={{ delay: 400 }} out:fly class="wrapper">
  <h1><Loader loading={tests_loading} /> Tests</h1>
  <div class="tests-controls">
    <button on:click={runAllTests}>
      {#if any_test_running}
        &nbsp;&nbsp;&nbsp;<Loader />&nbsp;&nbsp;&nbsp;
      {:else}
        Run all
      {/if}
    </button>
  </div>
  {#if tests_error}
    <span transition:slide class="message error">{tests_error}</span>
  {/if}
  <div class="tests">
    {#each tests as test, i}
      <Box>
        <div class="test-wrapper">
          <div class="test-bar">
            <span>
              {test.id}
              {test.script_name}
            </span>
            <button
              on:click={() => {
                testRun(i);
              }}
            >
              {#if test.running}
                &nbsp;<Loader />&nbsp;
              {:else}
                Run
              {/if}
            </button>
          </div>
          <div class="test-content">
            <p class="test-name">{test.test_name}</p>
            <p>{test.description}</p>
            {#if test.passed == 1}
              <span transition:slide class="message success">Passing</span>
            {:else if test.passed == 0}
              <span transition:slide class="message error">Failing</span>
            {/if}
            {#if test.error}
              <span transition:slide class="message error">{test.error}</span>
            {/if}
          </div>
        </div>
      </Box>
    {/each}
  </div>
</div>

<style>
  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
  .wrapper {
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    padding: 100px 0;
    width: 700px;
    min-height: 100%;
  }

  .tests-controls {
    display: flex;
    justify-content: center;
    margin-bottom: 50px;
  }

  .tests {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 20px;
    row-gap: 30px;
  }

  .test-wrapper {
    border-radius: var(--border-radius);
    background: var(--secondary);
  }
  .test-bar {
    display: flex;
    padding: 10px 20px;
  }
  .test-bar > span {
    flex: 1;
    color: var(--text-secondary);
  }
  .test-bar > button {
    margin: 0;
    padding: 0 20px;
  }
  .test-content {
    padding: 20px;
    border-radius: var(--border-radius);
    background: var(--main);
  }
  .test-name {
    font-weight: 900;
  }

  .message {
    display: block;
  }
</style>
