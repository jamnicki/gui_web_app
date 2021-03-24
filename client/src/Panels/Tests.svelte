<script>
  import { fly, slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { panel } from '../stores.js';
  import Loader from '../Components/Loader.svelte';

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

  $: all_passed = (() => {
    for (let test of tests) {
      if (test.passed != 1) {
        return false;
      }
    }
    return true;
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
      // elevate a failed test to the top of the list
      if (json.passed == 0 && test.passed != 0) {
        tests = tests.filter((t) => t.id != test.id);
        tests.unshift(test);
      }
      // find a proper place for a resolved test
      else if (json.passed == 1 && test.passed == 0) {
        tests = tests.filter((t) => t.id != test.id);
        let index = 0;
        for (let t of tests) {
          if (t.id < test.id) {
            index = tests.indexOf(t) + 1;
          }
        }
        tests.splice(index, 0, test);
      }
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

  function startMonitor() {
    $panel = 'Monitor';
  }
</script>

<div in:fly={{ delay: 400 }} out:fly class="wrapper">
  <h1><Loader loading={tests_loading} /> Tests</h1>
  <div class="controls">
    <button on:click={runAllTests}>
      {#if any_test_running}
        &nbsp;&nbsp;&nbsp;<Loader />&nbsp;&nbsp;&nbsp;
      {:else}
        Run all
      {/if}
    </button>
    {#if all_passed}
      <button class="success" on:click={startMonitor}>Start engines</button>
    {/if}
  </div>
  {#if tests_error}
    <span transition:slide class="message error">{tests_error}</span>
  {/if}
  <div class="tests">
    {#each tests as test, i (test.id)}
      <div
        class="test"
        class:big={test.passed == 0}
        animate:flip={{ duration: 400 }}
      >
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
    {/each}
  </div>
</div>

<style>
  .wrapper {
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    padding: 100px 0;
    width: 700px;
    min-height: 100%;
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
  .controls {
    display: flex;
    justify-content: center;
    margin-bottom: 50px;
  }

  button.success {
    margin-left: 20px;
  }

  .tests {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 20px;
    row-gap: 30px;
  }

  .test.big {
    grid-column: 1 / span 2;
  }

  .test-bar {
    display: flex;
    padding: 10px 20px;
    margin-bottom: 5px;
    border-radius: var(--border-radius);
    background-color: var(--main);
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
    background-color: var(--main);
  }

  .test-name {
    font-weight: 900;
  }

  .message {
    display: block;
  }
</style>
