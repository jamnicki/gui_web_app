
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function fix_and_outro_and_destroy_block(block, lookup) {
        block.f();
        outro_and_destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const panel = writable('Login'); // Login, Tests, Monitor
    const connected = writable(0);
    const debug = writable(0);

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/Components/Loader.svelte generated by Svelte v3.35.0 */
    const file$4 = "src/Components/Loader.svelte";

    function create_fragment$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", /*css_class*/ ctx[1]);
    			add_location(span, file$4, 60, 0, 957);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			span.innerHTML = /*loader*/ ctx[0];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*loader*/ 1) span.innerHTML = /*loader*/ ctx[0];
    			if (dirty & /*css_class*/ 2) {
    				attr_dev(span, "class", /*css_class*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let css_class;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Loader", slots, []);
    	let { type = "slash" } = $$props;
    	let { timer = 300 } = $$props;
    	let { loading = true } = $$props;
    	let { success = false } = $$props;
    	let { fresh = true } = $$props;
    	let { always_visible = false } = $$props;

    	// Types
    	let types = {
    		dots: [".", "..", "..."],
    		clock: "◴◷◶◵",
    		braille: "⣾⣽⣻⢿⡿⣟⣯⣷",
    		squares: "▖▘▝▗",
    		slash: "/\\"
    	};

    	let loader;
    	let loop;
    	let stages = types[type];

    	function start() {
    		$$invalidate(2, fresh = false);
    		let i = 0;
    		$$invalidate(0, loader = stages[i]);

    		loop = setInterval(
    			() => {
    				i++;

    				if (i == stages.length) {
    					i = 0;
    				}

    				$$invalidate(0, loader = stages[i]);
    			},
    			timer
    		);
    	}

    	function stop() {
    		clearInterval(loop);
    		$$invalidate(0, loader = always_visible ? "█" : "");
    	}

    	onDestroy(() => {
    		stop();
    	});

    	const writable_props = ["type", "timer", "loading", "success", "fresh", "always_visible"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Loader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("timer" in $$props) $$invalidate(4, timer = $$props.timer);
    		if ("loading" in $$props) $$invalidate(5, loading = $$props.loading);
    		if ("success" in $$props) $$invalidate(6, success = $$props.success);
    		if ("fresh" in $$props) $$invalidate(2, fresh = $$props.fresh);
    		if ("always_visible" in $$props) $$invalidate(7, always_visible = $$props.always_visible);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		type,
    		timer,
    		loading,
    		success,
    		fresh,
    		always_visible,
    		types,
    		loader,
    		loop,
    		stages,
    		start,
    		stop,
    		css_class
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(3, type = $$props.type);
    		if ("timer" in $$props) $$invalidate(4, timer = $$props.timer);
    		if ("loading" in $$props) $$invalidate(5, loading = $$props.loading);
    		if ("success" in $$props) $$invalidate(6, success = $$props.success);
    		if ("fresh" in $$props) $$invalidate(2, fresh = $$props.fresh);
    		if ("always_visible" in $$props) $$invalidate(7, always_visible = $$props.always_visible);
    		if ("types" in $$props) types = $$props.types;
    		if ("loader" in $$props) $$invalidate(0, loader = $$props.loader);
    		if ("loop" in $$props) loop = $$props.loop;
    		if ("stages" in $$props) stages = $$props.stages;
    		if ("css_class" in $$props) $$invalidate(1, css_class = $$props.css_class);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*fresh, loading, success*/ 100) {
    			$$invalidate(1, css_class = fresh
    			? ""
    			: loading ? "loading" : success ? "success" : "fail");
    		}

    		if ($$self.$$.dirty & /*loading*/ 32) {
    			if (loading) {
    				start();
    			} else {
    				stop();
    			}
    		}
    	};

    	return [loader, css_class, fresh, type, timer, loading, success, always_visible];
    }

    class Loader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			type: 3,
    			timer: 4,
    			loading: 5,
    			success: 6,
    			fresh: 2,
    			always_visible: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loader",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get type() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timer() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timer(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get success() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set success(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fresh() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fresh(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get always_visible() {
    		throw new Error("<Loader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set always_visible(value) {
    		throw new Error("<Loader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Panels/Login.svelte generated by Svelte v3.35.0 */
    const file$3 = "src/Panels/Login.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[24] = i;
    	return child_ctx;
    }

    // (98:6) {:else}
    function create_else_block_1$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-7h8574");
    			add_location(input, file$3, 98, 8, 2704);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*hostname_input*/ ctx[1]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[16]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*hostname_input*/ 2 && input.value !== /*hostname_input*/ ctx[1]) {
    				set_input_value(input, /*hostname_input*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(98:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (92:6) {#if !addresses_input}
    function create_if_block_6$2(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*addresses*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "class", "svelte-7h8574");
    			if (/*hostname_select*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[15].call(select));
    			add_location(select, file$3, 92, 8, 2517);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*hostname_select*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[15]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addresses*/ 4) {
    				each_value = /*addresses*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*hostname_select*/ 1) {
    				select_option(select, /*hostname_select*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$2.name,
    		type: "if",
    		source: "(92:6) {#if !addresses_input}",
    		ctx
    	});

    	return block;
    }

    // (94:10) {#each addresses as address, i}
    function create_each_block$1(ctx) {
    	let option;
    	let t_value = /*address*/ ctx[22] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*i*/ ctx[24];
    			option.value = option.__value;
    			add_location(option, file$3, 94, 12, 2609);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addresses*/ 4 && t_value !== (t_value = /*address*/ ctx[22] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(94:10) {#each addresses as address, i}",
    		ctx
    	});

    	return block;
    }

    // (110:6) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "icon/list.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "select");
    			add_location(img, file$3, 116, 10, 3157);
    			attr_dev(div, "class", "addresses-action svelte-7h8574");
    			add_location(div, file$3, 110, 8, 3017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(110:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (101:6) {#if !addresses_input}
    function create_if_block_5$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "icon/edit.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "input");
    			add_location(img, file$3, 107, 10, 2940);
    			attr_dev(div, "class", "addresses-action svelte-7h8574");
    			add_location(div, file$3, 101, 8, 2803);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(101:6) {#if !addresses_input}",
    		ctx
    	});

    	return block;
    }

    // (125:4) {#if addresses_error}
    function create_if_block_4$2(ctx) {
    	let span;
    	let t;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*addresses_error*/ ctx[6]);
    			attr_dev(span, "class", "message error svelte-7h8574");
    			add_location(span, file$3, 125, 6, 3395);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*addresses_error*/ 64) set_data_dev(t, /*addresses_error*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, true);
    				span_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, false);
    			span_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_transition) span_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(125:4) {#if addresses_error}",
    		ctx
    	});

    	return block;
    }

    // (128:4) {#if addresses_hint}
    function create_if_block_3$2(ctx) {
    	let span;
    	let t;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*addresses_hint*/ ctx[7]);
    			attr_dev(span, "class", "message hint svelte-7h8574");
    			add_location(span, file$3, 128, 6, 3506);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*addresses_hint*/ 128) set_data_dev(t, /*addresses_hint*/ ctx[7]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, true);
    				span_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, false);
    			span_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_transition) span_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(128:4) {#if addresses_hint}",
    		ctx
    	});

    	return block;
    }

    // (147:4) {#if $connected}
    function create_if_block_2$2(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Connected!";
    			attr_dev(div, "class", "message success svelte-7h8574");
    			add_location(div, file$3, 147, 6, 4013);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(147:4) {#if $connected}",
    		ctx
    	});

    	return block;
    }

    // (150:4) {#if login_error}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*login_error*/ ctx[9]);
    			attr_dev(div, "class", "message error svelte-7h8574");
    			add_location(div, file$3, 150, 6, 4114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*login_error*/ 512) set_data_dev(t, /*login_error*/ ctx[9]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(150:4) {#if login_error}",
    		ctx
    	});

    	return block;
    }

    // (153:4) {#if login_hint}
    function create_if_block$2(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*login_hint*/ ctx[10]);
    			attr_dev(div, "class", "message hint svelte-7h8574");
    			add_location(div, file$3, 153, 6, 4215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*login_hint*/ 1024) set_data_dev(t, /*login_hint*/ ctx[10]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, slide, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(153:4) {#if login_hint}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div4;
    	let div3;
    	let div1;
    	let loader0;
    	let t0;
    	let h3;
    	let t2;
    	let t3;
    	let t4;
    	let div0;
    	let img;
    	let img_src_value;
    	let t5;
    	let t6;
    	let t7;
    	let form;
    	let label0;
    	let t8;
    	let input0;
    	let t9;
    	let label1;
    	let t10;
    	let input1;
    	let t11;
    	let input2;
    	let t12;
    	let div2;
    	let loader1;
    	let t13;
    	let t14;
    	let t15;
    	let div4_intro;
    	let div4_outro;
    	let current;
    	let mounted;
    	let dispose;

    	loader0 = new Loader({
    			props: {
    				loading: /*addresses_loading*/ ctx[8],
    				success: !/*addresses_error*/ ctx[6],
    				always_visible: true
    			},
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (!/*addresses_input*/ ctx[3]) return create_if_block_6$2;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*addresses_input*/ ctx[3]) return create_if_block_5$2;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);
    	let if_block2 = /*addresses_error*/ ctx[6] && create_if_block_4$2(ctx);
    	let if_block3 = /*addresses_hint*/ ctx[7] && create_if_block_3$2(ctx);

    	loader1 = new Loader({
    			props: {
    				type: "dots",
    				loading: /*login_loading*/ ctx[11]
    			},
    			$$inline: true
    		});

    	let if_block4 = /*$connected*/ ctx[12] && create_if_block_2$2(ctx);
    	let if_block5 = /*login_error*/ ctx[9] && create_if_block_1$2(ctx);
    	let if_block6 = /*login_hint*/ ctx[10] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div1 = element("div");
    			create_component(loader0.$$.fragment);
    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "SSH";
    			t2 = space();
    			if_block0.c();
    			t3 = space();
    			if_block1.c();
    			t4 = space();
    			div0 = element("div");
    			img = element("img");
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			t7 = space();
    			form = element("form");
    			label0 = element("label");
    			t8 = text("Username\n        ");
    			input0 = element("input");
    			t9 = space();
    			label1 = element("label");
    			t10 = text("Password\n        ");
    			input1 = element("input");
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			div2 = element("div");
    			create_component(loader1.$$.fragment);
    			t13 = space();
    			if (if_block4) if_block4.c();
    			t14 = space();
    			if (if_block5) if_block5.c();
    			t15 = space();
    			if (if_block6) if_block6.c();
    			attr_dev(h3, "class", "svelte-7h8574");
    			add_location(h3, file$3, 90, 6, 2467);
    			if (img.src !== (img_src_value = "icon/refresh.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "select");
    			add_location(img, file$3, 120, 8, 3294);
    			attr_dev(div0, "class", "addresses-action svelte-7h8574");
    			add_location(div0, file$3, 119, 6, 3231);
    			attr_dev(div1, "class", "address svelte-7h8574");
    			add_location(div1, file$3, 84, 4, 2315);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-7h8574");
    			add_location(input0, file$3, 134, 8, 3635);
    			add_location(label0, file$3, 132, 6, 3602);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "class", "svelte-7h8574");
    			add_location(input1, file$3, 138, 8, 3733);
    			add_location(label1, file$3, 136, 6, 3700);
    			attr_dev(input2, "type", "submit");
    			input2.value = "Login";
    			attr_dev(input2, "class", "svelte-7h8574");
    			add_location(input2, file$3, 140, 6, 3802);
    			attr_dev(div2, "class", "login-loader svelte-7h8574");
    			add_location(div2, file$3, 141, 6, 3878);
    			attr_dev(form, "class", "svelte-7h8574");
    			add_location(form, file$3, 131, 4, 3589);
    			attr_dev(div3, "class", "login svelte-7h8574");
    			add_location(div3, file$3, 83, 2, 2266);
    			attr_dev(div4, "class", "wrapper svelte-7h8574");
    			add_location(div4, file$3, 82, 0, 2210);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			mount_component(loader0, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, h3);
    			append_dev(div1, t2);
    			if_block0.m(div1, null);
    			append_dev(div1, t3);
    			if_block1.m(div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div3, t5);
    			if (if_block2) if_block2.m(div3, null);
    			append_dev(div3, t6);
    			if (if_block3) if_block3.m(div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, form);
    			append_dev(form, label0);
    			append_dev(label0, t8);
    			append_dev(label0, input0);
    			set_input_value(input0, /*username*/ ctx[4]);
    			append_dev(form, t9);
    			append_dev(form, label1);
    			append_dev(label1, t10);
    			append_dev(label1, input1);
    			set_input_value(input1, /*password*/ ctx[5]);
    			append_dev(form, t11);
    			append_dev(form, input2);
    			append_dev(form, t12);
    			append_dev(form, div2);
    			mount_component(loader1, div2, null);
    			append_dev(div3, t13);
    			if (if_block4) if_block4.m(div3, null);
    			append_dev(div3, t14);
    			if (if_block5) if_block5.m(div3, null);
    			append_dev(div3, t15);
    			if (if_block6) if_block6.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*getAddresses*/ ctx[13], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[19]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[20]),
    					listen_dev(input2, "click", prevent_default(/*login*/ ctx[14]), false, true, false),
    					listen_dev(div3, "keydown", handleEnter, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const loader0_changes = {};
    			if (dirty & /*addresses_loading*/ 256) loader0_changes.loading = /*addresses_loading*/ ctx[8];
    			if (dirty & /*addresses_error*/ 64) loader0_changes.success = !/*addresses_error*/ ctx[6];
    			loader0.$set(loader0_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div1, t3);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, t4);
    				}
    			}

    			if (/*addresses_error*/ ctx[6]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*addresses_error*/ 64) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4$2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div3, t6);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*addresses_hint*/ ctx[7]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*addresses_hint*/ 128) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_3$2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div3, t7);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*username*/ 16 && input0.value !== /*username*/ ctx[4]) {
    				set_input_value(input0, /*username*/ ctx[4]);
    			}

    			if (dirty & /*password*/ 32 && input1.value !== /*password*/ ctx[5]) {
    				set_input_value(input1, /*password*/ ctx[5]);
    			}

    			const loader1_changes = {};
    			if (dirty & /*login_loading*/ 2048) loader1_changes.loading = /*login_loading*/ ctx[11];
    			loader1.$set(loader1_changes);

    			if (/*$connected*/ ctx[12]) {
    				if (if_block4) {
    					if (dirty & /*$connected*/ 4096) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_2$2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div3, t14);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*login_error*/ ctx[9]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty & /*login_error*/ 512) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_1$2(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(div3, t15);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*login_hint*/ ctx[10]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty & /*login_hint*/ 1024) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block$2(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(div3, null);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader0.$$.fragment, local);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(loader1.$$.fragment, local);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);

    			add_render_callback(() => {
    				if (div4_outro) div4_outro.end(1);
    				if (!div4_intro) div4_intro = create_in_transition(div4, fly, { delay: 400 });
    				div4_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader0.$$.fragment, local);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(loader1.$$.fragment, local);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			if (div4_intro) div4_intro.invalidate();
    			div4_outro = create_out_transition(div4, fly, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(loader0);
    			if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_component(loader1);
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (detaching && div4_outro) div4_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleEnter(e) {
    	if (e.key === "Enter") connect();
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let hostname;
    	let $connected;
    	validate_store(connected, "connected");
    	component_subscribe($$self, connected, $$value => $$invalidate(12, $connected = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	let hostname_select;
    	let hostname_input;
    	let username;
    	let password;

    	// Predefined addresses
    	let addresses = ["192.168.1.1", "192.168.1.115"];

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
    		$$invalidate(8, addresses_loading = true);

    		// Get data
    		try {
    			const res = await fetch("/available-addresses");
    			const json = await res.json();

    			if (json.addresses) {
    				// Filter out addresses that are already on the list
    				const new_addresses = json.addresses.filter(elem => {
    					return !addresses.includes(elem);
    				});

    				// Combine the old and new addresses
    				$$invalidate(2, addresses = addresses.concat(new_addresses));
    			}

    			// Replace Errors and Hints if there are new ones or empty them
    			$$invalidate(6, addresses_error = json.error || "");

    			$$invalidate(7, addresses_hint = json.hint || "");
    		} catch(error) {
    			$$invalidate(6, addresses_error = error);
    		}

    		$$invalidate(8, addresses_loading = false);
    	}

    	getAddresses();

    	async function login() {
    		$$invalidate(11, login_loading = true);

    		// Handle empty inputs
    		if (hostname == "") hostname = undefined;

    		if (username == "") $$invalidate(4, username = undefined);
    		if (password == "") $$invalidate(5, password = undefined);

    		// Send data
    		try {
    			const res = await fetch("/connect", {
    				method: "POST",
    				headers: { "Content-Type": "application/json" },
    				body: JSON.stringify({ hostname, username, password })
    			});

    			const json = await res.json();
    			set_store_value(connected, $connected = json.connected, $connected);
    			$$invalidate(9, login_error = json.error || "");
    			$$invalidate(10, login_hint = json.hint || "");
    		} catch(error) {
    			$$invalidate(9, login_error = error);
    		}

    		$$invalidate(11, login_loading = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		hostname_select = select_value(this);
    		$$invalidate(0, hostname_select);
    	}

    	function input_input_handler() {
    		hostname_input = this.value;
    		$$invalidate(1, hostname_input);
    	}

    	const click_handler = () => {
    		$$invalidate(3, addresses_input = true);
    	};

    	const click_handler_1 = () => {
    		addresses_form = "SELECT";
    	};

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(4, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(5, password);
    	}

    	$$self.$capture_state = () => ({
    		slide,
    		fly,
    		connected,
    		Loader,
    		hostname_select,
    		hostname_input,
    		username,
    		password,
    		addresses,
    		addresses_input,
    		addresses_error,
    		addresses_hint,
    		addresses_loading,
    		login_error,
    		login_hint,
    		login_loading,
    		getAddresses,
    		login,
    		handleEnter,
    		hostname,
    		$connected
    	});

    	$$self.$inject_state = $$props => {
    		if ("hostname_select" in $$props) $$invalidate(0, hostname_select = $$props.hostname_select);
    		if ("hostname_input" in $$props) $$invalidate(1, hostname_input = $$props.hostname_input);
    		if ("username" in $$props) $$invalidate(4, username = $$props.username);
    		if ("password" in $$props) $$invalidate(5, password = $$props.password);
    		if ("addresses" in $$props) $$invalidate(2, addresses = $$props.addresses);
    		if ("addresses_input" in $$props) $$invalidate(3, addresses_input = $$props.addresses_input);
    		if ("addresses_error" in $$props) $$invalidate(6, addresses_error = $$props.addresses_error);
    		if ("addresses_hint" in $$props) $$invalidate(7, addresses_hint = $$props.addresses_hint);
    		if ("addresses_loading" in $$props) $$invalidate(8, addresses_loading = $$props.addresses_loading);
    		if ("login_error" in $$props) $$invalidate(9, login_error = $$props.login_error);
    		if ("login_hint" in $$props) $$invalidate(10, login_hint = $$props.login_hint);
    		if ("login_loading" in $$props) $$invalidate(11, login_loading = $$props.login_loading);
    		if ("hostname" in $$props) hostname = $$props.hostname;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*addresses_input, hostname_input, addresses, hostname_select*/ 15) {
    			hostname = addresses_input
    			? hostname_input
    			: addresses[hostname_select];
    		}
    	};

    	return [
    		hostname_select,
    		hostname_input,
    		addresses,
    		addresses_input,
    		username,
    		password,
    		addresses_error,
    		addresses_hint,
    		addresses_loading,
    		login_error,
    		login_hint,
    		login_loading,
    		$connected,
    		getAddresses,
    		login,
    		select_change_handler,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    function flip(node, animation, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src/Panels/Tests.svelte generated by Svelte v3.35.0 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/Panels/Tests.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (106:6) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Run all");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(106:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (104:6) {#if any_test_running}
    function create_if_block_6$1(ctx) {
    	let t0;
    	let loader;
    	let t1;
    	let current;
    	loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = text("   ");
    			create_component(loader.$$.fragment);
    			t1 = text("   ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(loader, target, anchor);
    			insert_dev(target, t1, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(loader, detaching);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(104:6) {#if any_test_running}",
    		ctx
    	});

    	return block;
    }

    // (110:4) {#if all_passed}
    function create_if_block_5$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Start engines";
    			attr_dev(button, "class", "success svelte-1huot15");
    			add_location(button, file$2, 110, 6, 2811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*startMonitor*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(110:4) {#if all_passed}",
    		ctx
    	});

    	return block;
    }

    // (114:2) {#if tests_error}
    function create_if_block_4$1(ctx) {
    	let span;
    	let t;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*tests_error*/ ctx[1]);
    			attr_dev(span, "class", "message error svelte-1huot15");
    			add_location(span, file$2, 114, 4, 2925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*tests_error*/ 2) set_data_dev(t, /*tests_error*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, true);
    				span_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, false);
    			span_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_transition) span_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(114:2) {#if tests_error}",
    		ctx
    	});

    	return block;
    }

    // (136:12) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Run");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(136:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (134:12) {#if test.running}
    function create_if_block_3$1(ctx) {
    	let t0;
    	let loader;
    	let t1;
    	let current;
    	loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			t0 = text(" ");
    			create_component(loader.$$.fragment);
    			t1 = text(" ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(loader, target, anchor);
    			insert_dev(target, t1, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(loader, detaching);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(134:12) {#if test.running}",
    		ctx
    	});

    	return block;
    }

    // (146:37) 
    function create_if_block_2$1(ctx) {
    	let span;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Failing";
    			attr_dev(span, "class", "message error svelte-1huot15");
    			add_location(span, file$2, 146, 12, 3837);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, true);
    				span_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, false);
    			span_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_transition) span_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(146:37) ",
    		ctx
    	});

    	return block;
    }

    // (144:10) {#if test.passed == 1}
    function create_if_block_1$1(ctx) {
    	let span;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Passing";
    			attr_dev(span, "class", "message success svelte-1huot15");
    			add_location(span, file$2, 144, 12, 3725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, true);
    				span_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, false);
    			span_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_transition) span_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(144:10) {#if test.passed == 1}",
    		ctx
    	});

    	return block;
    }

    // (149:10) {#if test.error}
    function create_if_block$1(ctx) {
    	let span;
    	let t_value = /*test*/ ctx[11].error + "";
    	let t;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "message error svelte-1huot15");
    			add_location(span, file$2, 149, 12, 3952);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*tests*/ 1) && t_value !== (t_value = /*test*/ ctx[11].error + "")) set_data_dev(t, t_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, true);
    				span_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!span_transition) span_transition = create_bidirectional_transition(span, slide, {}, false);
    			span_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching && span_transition) span_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(149:10) {#if test.error}",
    		ctx
    	});

    	return block;
    }

    // (118:4) {#each tests as test, i (test.id)}
    function create_each_block(key_1, ctx) {
    	let div2;
    	let div0;
    	let span;
    	let t0_value = /*test*/ ctx[11].id + "";
    	let t0;
    	let t1;
    	let t2_value = /*test*/ ctx[11].script_name + "";
    	let t2;
    	let t3;
    	let button;
    	let current_block_type_index;
    	let if_block0;
    	let t4;
    	let div1;
    	let p0;
    	let t5_value = /*test*/ ctx[11].test_name + "";
    	let t5;
    	let t6;
    	let p1;
    	let t7_value = /*test*/ ctx[11].description + "";
    	let t7;
    	let t8;
    	let current_block_type_index_1;
    	let if_block1;
    	let t9;
    	let t10;
    	let rect;
    	let stop_animation = noop;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_3$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*test*/ ctx[11].running) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*i*/ ctx[13]);
    	}

    	const if_block_creators_1 = [create_if_block_1$1, create_if_block_2$1];
    	const if_blocks_1 = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*test*/ ctx[11].passed == 1) return 0;
    		if (/*test*/ ctx[11].passed == 0) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_2(ctx))) {
    		if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	let if_block2 = /*test*/ ctx[11].error && create_if_block$1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			if_block0.c();
    			t4 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			p1 = element("p");
    			t7 = text(t7_value);
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			attr_dev(span, "class", "svelte-1huot15");
    			add_location(span, file$2, 124, 10, 3219);
    			attr_dev(button, "class", "svelte-1huot15");
    			add_location(button, file$2, 128, 10, 3307);
    			attr_dev(div0, "class", "test-bar svelte-1huot15");
    			add_location(div0, file$2, 123, 8, 3186);
    			attr_dev(p0, "class", "test-name svelte-1huot15");
    			add_location(p0, file$2, 141, 10, 3602);
    			add_location(p1, file$2, 142, 10, 3654);
    			attr_dev(div1, "class", "test-content svelte-1huot15");
    			add_location(div1, file$2, 140, 8, 3565);
    			attr_dev(div2, "class", "test svelte-1huot15");
    			toggle_class(div2, "big", /*test*/ ctx[11].passed == 0);
    			add_location(div2, file$2, 118, 6, 3066);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(div0, t3);
    			append_dev(div0, button);
    			if_blocks[current_block_type_index].m(button, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t5);
    			append_dev(div1, t6);
    			append_dev(div1, p1);
    			append_dev(p1, t7);
    			append_dev(div1, t8);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(div1, null);
    			}

    			append_dev(div1, t9);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div2, t10);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*tests*/ 1) && t0_value !== (t0_value = /*test*/ ctx[11].id + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*tests*/ 1) && t2_value !== (t2_value = /*test*/ ctx[11].script_name + "")) set_data_dev(t2, t2_value);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(button, null);
    			}

    			if ((!current || dirty & /*tests*/ 1) && t5_value !== (t5_value = /*test*/ ctx[11].test_name + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*tests*/ 1) && t7_value !== (t7_value = /*test*/ ctx[11].description + "")) set_data_dev(t7, t7_value);
    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_2(ctx);

    			if (current_block_type_index_1 !== previous_block_index_1) {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block1 = if_blocks_1[current_block_type_index_1];

    					if (!if_block1) {
    						if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div1, t9);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (/*test*/ ctx[11].error) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*tests*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*tests*/ 1) {
    				toggle_class(div2, "big", /*test*/ ctx[11].passed == 0);
    			}
    		},
    		r: function measure() {
    			rect = div2.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(div2);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(div2, rect, flip, { duration: 400 });
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}

    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(118:4) {#each tests as test, i (test.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let h1;
    	let loader;
    	let t0;
    	let t1;
    	let div0;
    	let button;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let div2_intro;
    	let div2_outro;
    	let current;
    	let mounted;
    	let dispose;

    	loader = new Loader({
    			props: { loading: /*tests_loading*/ ctx[2] },
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block_6$1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*any_test_running*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*all_passed*/ ctx[4] && create_if_block_5$1(ctx);
    	let if_block2 = /*tests_error*/ ctx[1] && create_if_block_4$1(ctx);
    	let each_value = /*tests*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*test*/ ctx[11].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h1 = element("h1");
    			create_component(loader.$$.fragment);
    			t0 = text(" Tests");
    			t1 = space();
    			div0 = element("div");
    			button = element("button");
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-1huot15");
    			add_location(h1, file$2, 100, 2, 2533);
    			add_location(button, file$2, 102, 4, 2612);
    			attr_dev(div0, "class", "controls svelte-1huot15");
    			add_location(div0, file$2, 101, 2, 2585);
    			attr_dev(div1, "class", "tests svelte-1huot15");
    			add_location(div1, file$2, 116, 2, 3001);
    			attr_dev(div2, "class", "wrapper svelte-1huot15");
    			add_location(div2, file$2, 99, 0, 2477);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h1);
    			mount_component(loader, h1, null);
    			append_dev(h1, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, button);
    			if_blocks[current_block_type_index].m(button, null);
    			append_dev(div0, t2);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div2, t3);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*runAllTests*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const loader_changes = {};
    			if (dirty & /*tests_loading*/ 4) loader_changes.loading = /*tests_loading*/ ctx[2];
    			loader.$set(loader_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(button, null);
    			}

    			if (/*all_passed*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5$1(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*tests_error*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*tests_error*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div2, t4);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*tests, testRun*/ 33) {
    				each_value = /*tests*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block2);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				if (!div2_intro) div2_intro = create_in_transition(div2, fly, { delay: 400 });
    				div2_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fly, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(loader);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div2_outro) div2_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let any_test_running;
    	let all_passed;
    	let $panel;
    	validate_store(panel, "panel");
    	component_subscribe($$self, panel, $$value => $$invalidate(9, $panel = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tests", slots, []);
    	let tests = [];
    	let tests_error;
    	let tests_loading = false;

    	async function getTests() {
    		$$invalidate(2, tests_loading = true);

    		// Get data
    		try {
    			const res = await fetch("/tests/info-all");
    			const json = await res.json();

    			if (!json.error) {
    				// Additional fields intended for running tests
    				for (let test of json.tests_info) {
    					test.running = false;
    					test.passed = -1;
    					test.error = "";
    				}

    				$$invalidate(0, tests = json.tests_info);
    			}

    			// Replace Errors if there are new ones or empty them
    			$$invalidate(1, tests_error = json.error || "");
    		} catch(error) {
    			$$invalidate(1, tests_error = error);
    		}

    		$$invalidate(2, tests_loading = false);
    	}

    	getTests();

    	async function testRun(i) {
    		let test = tests[i];
    		console.log(`Running test number ${test.id}`);
    		test.running = true;

    		// Get data
    		try {
    			const res = await fetch(`/tests/run/${test.id}`);
    			const json = await res.json();

    			// if the test fails - elevate it to the top of the list
    			if (json.passed == 0 && test.passed != 0) {
    				$$invalidate(0, tests = tests.filter(t => t.id != test.id));
    				tests.unshift(test);
    			} else // if the test passes after a previous failure - put it back in place
    			if (json.passed == 1 && test.passed == 0) {
    				$$invalidate(0, tests = tests.filter(t => t.id != test.id));
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
    			test.error = json.error || "";
    		} catch(error) {
    			test.error = error;
    		}

    		test.running = false;
    		$$invalidate(0, tests);
    	}

    	function runAllTests() {
    		console.log("Running all tests...");

    		for (let i in tests) {
    			testRun(i);
    		}
    	}

    	function startMonitor() {
    		set_store_value(panel, $panel = "Monitor", $panel);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Tests> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => {
    		testRun(i);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		slide,
    		flip,
    		panel,
    		Loader,
    		tests,
    		tests_error,
    		tests_loading,
    		getTests,
    		testRun,
    		runAllTests,
    		startMonitor,
    		any_test_running,
    		all_passed,
    		$panel
    	});

    	$$self.$inject_state = $$props => {
    		if ("tests" in $$props) $$invalidate(0, tests = $$props.tests);
    		if ("tests_error" in $$props) $$invalidate(1, tests_error = $$props.tests_error);
    		if ("tests_loading" in $$props) $$invalidate(2, tests_loading = $$props.tests_loading);
    		if ("any_test_running" in $$props) $$invalidate(3, any_test_running = $$props.any_test_running);
    		if ("all_passed" in $$props) $$invalidate(4, all_passed = $$props.all_passed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tests*/ 1) {
    			$$invalidate(3, any_test_running = (() => {
    				for (let test of tests) {
    					if (test.running) {
    						return true;
    					}
    				}

    				return false;
    			})());
    		}

    		if ($$self.$$.dirty & /*tests*/ 1) {
    			$$invalidate(4, all_passed = (() => {
    				for (let test of tests) {
    					if (test.passed != 1) {
    						return false;
    					}
    				}

    				return true;
    			})());
    		}
    	};

    	return [
    		tests,
    		tests_error,
    		tests_loading,
    		any_test_running,
    		all_passed,
    		testRun,
    		runAllTests,
    		startMonitor,
    		click_handler
    	];
    }

    class Tests extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tests",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Panels/Monitor.svelte generated by Svelte v3.35.0 */
    const file$1 = "src/Panels/Monitor.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let img;
    	let img_src_value;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Monitor";
    			t1 = space();
    			img = element("img");
    			attr_dev(h1, "class", "svelte-159ow2e");
    			add_location(h1, file$1, 5, 2, 119);
    			if (img.src !== (img_src_value = "tumbleweed.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "tumbleweed");
    			attr_dev(img, "class", "svelte-159ow2e");
    			add_location(img, file$1, 6, 2, 138);
    			attr_dev(div, "class", "wrapper svelte-159ow2e");
    			add_location(div, file$1, 4, 0, 63);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, img);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { delay: 400 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Monitor", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Monitor> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ fly });
    	return [];
    }

    class Monitor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Monitor",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (39:2) {#if $connected}
    function create_if_block_5(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = (/*$panel*/ ctx[1] == "Tests" || /*$panel*/ ctx[1] == "Monitor") && create_if_block_7(ctx);
    	let if_block1 = /*$panel*/ ctx[1] == "Monitor" && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*$panel*/ ctx[1] == "Tests" || /*$panel*/ ctx[1] == "Monitor") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$panel*/ ctx[1] == "Monitor") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(39:2) {#if $connected}",
    		ctx
    	});

    	return block;
    }

    // (40:4) {#if $panel == 'Tests' || $panel == 'Monitor'}
    function create_if_block_7(ctx) {
    	let span0;
    	let t3;
    	let span1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = ` ${">"} `;
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Tests";
    			add_location(span0, file, 40, 6, 1026);
    			attr_dev(span1, "class", "button svelte-xp5i5m");
    			add_location(span1, file, 41, 6, 1063);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span1, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(40:4) {#if $panel == 'Tests' || $panel == 'Monitor'}",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#if $panel == 'Monitor'}
    function create_if_block_6(ctx) {
    	let span0;
    	let t3;
    	let span1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = ` ${">"} `;
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Monitor";
    			add_location(span0, file, 49, 6, 1223);
    			attr_dev(span1, "class", "button svelte-xp5i5m");
    			add_location(span1, file, 50, 6, 1260);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span1, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", /*click_handler_1*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(49:4) {#if $panel == 'Monitor'}",
    		ctx
    	});

    	return block;
    }

    // (66:32) 
    function create_if_block_4(ctx) {
    	let monitor;
    	let current;
    	monitor = new Monitor({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(monitor.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(monitor, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(monitor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(monitor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(monitor, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(66:32) ",
    		ctx
    	});

    	return block;
    }

    // (64:30) 
    function create_if_block_3(ctx) {
    	let tests;
    	let current;
    	tests = new Tests({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(tests.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tests, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tests.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tests.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tests, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(64:30) ",
    		ctx
    	});

    	return block;
    }

    // (62:2) {#if $panel == 'Login'}
    function create_if_block_2(ctx) {
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(62:2) {#if $panel == 'Login'}",
    		ctx
    	});

    	return block;
    }

    // (71:0) {#if $debug}
    function create_if_block(ctx) {
    	let div;
    	let promise;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 9,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*$connected*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Check";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Connect";
    			t4 = space();
    			button2 = element("button");
    			button2.textContent = "Disconnect";
    			add_location(button0, file, 81, 4, 1834);
    			add_location(button1, file, 82, 4, 1888);
    			add_location(button2, file, 83, 4, 1936);
    			attr_dev(div, "class", "check-connection svelte-xp5i5m");
    			add_location(div, file, 71, 2, 1577);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = t0;
    			append_dev(div, t0);
    			append_dev(div, button0);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			append_dev(div, t4);
    			append_dev(div, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*checkConnection*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*connect*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", /*disconnect*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*$connected*/ 1 && promise !== (promise = /*$connected*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[9] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(71:0) {#if $debug}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { panel, connected, debug }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import { panel, connected, debug }",
    		ctx
    	});

    	return block;
    }

    // (75:4) {:then value}
    function create_then_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*value*/ ctx[9]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(75:4) {:then value}",
    		ctx
    	});

    	return block;
    }

    // (78:6) {:else}
    function create_else_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Connection failed";
    			attr_dev(span, "class", "fail svelte-xp5i5m");
    			add_location(span, file, 78, 8, 1761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(78:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (76:6) {#if value}
    function create_if_block_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Connection alive";
    			attr_dev(span, "class", "success svelte-xp5i5m");
    			add_location(span, file, 76, 8, 1693);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(76:6) {#if value}",
    		ctx
    	});

    	return block;
    }

    // (73:23)        <Loader />     {:then value}
    function create_pending_block(ctx) {
    	let loader;
    	let current;
    	loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loader.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loader, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loader, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(73:23)        <Loader />     {:then value}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let span;
    	let t1;
    	let t2;
    	let main;
    	let current_block_type_index;
    	let if_block1;
    	let t3;
    	let if_block2_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$connected*/ ctx[0] && create_if_block_5(ctx);
    	const if_block_creators = [create_if_block_2, create_if_block_3, create_if_block_4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$panel*/ ctx[1] == "Login") return 0;
    		if (/*$panel*/ ctx[1] == "Tests") return 1;
    		if (/*$panel*/ ctx[1] == "Monitor") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block2 = /*$debug*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			span = element("span");
    			span.textContent = "Login";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			main = element("main");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr_dev(span, "class", "button svelte-xp5i5m");
    			add_location(span, file, 37, 2, 894);
    			attr_dev(nav, "class", "svelte-xp5i5m");
    			add_location(nav, file, 36, 0, 886);
    			attr_dev(main, "class", "svelte-xp5i5m");
    			add_location(main, file, 60, 0, 1404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, span);
    			append_dev(nav, t1);
    			if (if_block0) if_block0.m(nav, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			insert_dev(target, t3, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*disconnect*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$connected*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(nav, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (/*$debug*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*$debug*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching) detach_dev(t3);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $connected;
    	let $panel;
    	let $debug;
    	validate_store(connected, "connected");
    	component_subscribe($$self, connected, $$value => $$invalidate(0, $connected = $$value));
    	validate_store(panel, "panel");
    	component_subscribe($$self, panel, $$value => $$invalidate(1, $panel = $$value));
    	validate_store(debug, "debug");
    	component_subscribe($$self, debug, $$value => $$invalidate(2, $debug = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	async function checkConnection() {
    		let res = await fetch("/check-connection");
    		let json = await res.json();
    		console.log("Połączenie: " + Boolean(json.connected));
    		set_store_value(connected, $connected = json.connected, $connected);
    	}

    	function connect() {
    		set_store_value(connected, $connected = 1, $connected);
    	}

    	function disconnect() {
    		if (confirm("You will have to login again. Continue?")) {
    			set_store_value(connected, $connected = 0, $connected);
    		}
    	}

    	async function checkDebugMode() {
    		const res = await fetch("/debug");
    		const mess = await res.json();
    		set_store_value(debug, $debug = mess, $debug);
    	}

    	checkDebugMode();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		set_store_value(panel, $panel = "Tests", $panel);
    	};

    	const click_handler_1 = () => {
    		set_store_value(panel, $panel = "Monitor", $panel);
    	};

    	$$self.$capture_state = () => ({
    		panel,
    		connected,
    		debug,
    		Login,
    		Tests,
    		Monitor,
    		Loader,
    		checkConnection,
    		connect,
    		disconnect,
    		checkDebugMode,
    		$connected,
    		$panel,
    		$debug
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$connected*/ 1) {
    			if ($connected) {
    				set_store_value(panel, $panel = "Tests", $panel);
    			} else {
    				set_store_value(panel, $panel = "Login", $panel);
    			}
    		}
    	};

    	return [
    		$connected,
    		$panel,
    		$debug,
    		checkConnection,
    		connect,
    		disconnect,
    		click_handler,
    		click_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
