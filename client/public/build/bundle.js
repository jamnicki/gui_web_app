
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.34.0' }, detail)));
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
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

    /* src\Components\Box.svelte generated by Svelte v3.34.0 */

    const file$3 = "src\\Components\\Box.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "box svelte-1w17f70");
    			add_location(div, file$3, 1, 0, 2);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Box", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Box",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Components\Loader.svelte generated by Svelte v3.34.0 */
    const file$2 = "src\\Components\\Loader.svelte";

    function create_fragment$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", /*css_class*/ ctx[1]);
    			add_location(span, file$2, 59, 0, 1029);
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
    	let { type = "squares" } = $$props;
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

    /* src\Panels\Login.svelte generated by Svelte v3.34.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\Panels\\Login.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (117:44) 
    function create_if_block_8(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-1pl9smk");
    			add_location(input, file$1, 117, 10, 3125);
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
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(117:44) ",
    		ctx
    	});

    	return block;
    }

    // (111:8) {#if addresses_form == 'SELECT'}
    function create_if_block_7(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*addresses*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "class", "svelte-1pl9smk");
    			if (/*hostname_select*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[15].call(select));
    			add_location(select, file$1, 111, 10, 2891);
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
    			if (dirty & /*addresses*/ 16) {
    				each_value = /*addresses*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(111:8) {#if addresses_form == 'SELECT'}",
    		ctx
    	});

    	return block;
    }

    // (113:12) {#each addresses as address, i}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*address*/ ctx[23] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*i*/ ctx[25];
    			option.value = option.__value;
    			attr_dev(option, "class", "svelte-1pl9smk");
    			add_location(option, file$1, 113, 14, 2989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addresses*/ 16 && t_value !== (t_value = /*address*/ ctx[23] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(113:12) {#each addresses as address, i}",
    		ctx
    	});

    	return block;
    }

    // (124:44) 
    function create_if_block_6(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "SL";
    			attr_dev(span, "class", "addresses-action svelte-1pl9smk");
    			add_location(span, file$1, 124, 10, 3472);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler_1*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(124:44) ",
    		ctx
    	});

    	return block;
    }

    // (121:8) {#if addresses_form == 'SELECT'}
    function create_if_block_5(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "IN";
    			attr_dev(span, "class", "addresses-action svelte-1pl9smk");
    			add_location(span, file$1, 121, 10, 3315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(121:8) {#if addresses_form == 'SELECT'}",
    		ctx
    	});

    	return block;
    }

    // (130:6) {#if addresses_error}
    function create_if_block_4(ctx) {
    	let span;
    	let t;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*addresses_error*/ ctx[6]);
    			attr_dev(span, "class", "message error svelte-1pl9smk");
    			add_location(span, file$1, 130, 8, 3648);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(130:6) {#if addresses_error}",
    		ctx
    	});

    	return block;
    }

    // (133:6) {#if addresses_hint}
    function create_if_block_3$1(ctx) {
    	let span;
    	let t;
    	let span_transition;
    	let current;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*addresses_hint*/ ctx[7]);
    			attr_dev(span, "class", "message hint svelte-1pl9smk");
    			add_location(span, file$1, 133, 8, 3768);
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(133:6) {#if addresses_hint}",
    		ctx
    	});

    	return block;
    }

    // (151:6) {#if connected}
    function create_if_block_2$1(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Połączono!";
    			attr_dev(div, "class", "message success svelte-1pl9smk");
    			add_location(div, file$1, 151, 8, 4334);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(151:6) {#if connected}",
    		ctx
    	});

    	return block;
    }

    // (154:6) {#if login_error}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*login_error*/ ctx[10]);
    			attr_dev(div, "class", "message error svelte-1pl9smk");
    			add_location(div, file$1, 154, 8, 4444);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*login_error*/ 1024) set_data_dev(t, /*login_error*/ ctx[10]);
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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(154:6) {#if login_error}",
    		ctx
    	});

    	return block;
    }

    // (157:6) {#if login_hint}
    function create_if_block$1(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*login_hint*/ ctx[11]);
    			attr_dev(div, "class", "message hint svelte-1pl9smk");
    			add_location(div, file$1, 157, 8, 4554);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*login_hint*/ 2048) set_data_dev(t, /*login_hint*/ ctx[11]);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(157:6) {#if login_hint}",
    		ctx
    	});

    	return block;
    }

    // (104:2) <Box>
    function create_default_slot(ctx) {
    	let div2;
    	let div0;
    	let loader0;
    	let t0;
    	let h3;
    	let t2;
    	let t3;
    	let span;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let form;
    	let label0;
    	let t9;
    	let input0;
    	let t10;
    	let label1;
    	let t11;
    	let input1;
    	let t12;
    	let input2;
    	let t13;
    	let div1;
    	let loader1;
    	let t14;
    	let t15;
    	let t16;
    	let current;
    	let mounted;
    	let dispose;

    	loader0 = new Loader({
    			props: {
    				loading: /*addresses_loading*/ ctx[8],
    				success: !/*addresses_error*/ ctx[6],
    				always_visible: true,
    				type: "slash"
    			},
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (/*addresses_form*/ ctx[9] == "SELECT") return create_if_block_7;
    		if (/*addresses_form*/ ctx[9] == "INPUT") return create_if_block_8;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*addresses_form*/ ctx[9] == "SELECT") return create_if_block_5;
    		if (/*addresses_form*/ ctx[9] == "INPUT") return create_if_block_6;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1 && current_block_type_1(ctx);
    	let if_block2 = /*addresses_error*/ ctx[6] && create_if_block_4(ctx);
    	let if_block3 = /*addresses_hint*/ ctx[7] && create_if_block_3$1(ctx);

    	loader1 = new Loader({
    			props: {
    				type: "dots",
    				loading: /*login_loading*/ ctx[12]
    			},
    			$$inline: true
    		});

    	let if_block4 = /*connected*/ ctx[5] && create_if_block_2$1(ctx);
    	let if_block5 = /*login_error*/ ctx[10] && create_if_block_1$1(ctx);
    	let if_block6 = /*login_hint*/ ctx[11] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(loader0.$$.fragment);
    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "SSH";
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			span = element("span");
    			span.textContent = "F5";
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			if (if_block2) if_block2.c();
    			t7 = space();
    			if (if_block3) if_block3.c();
    			t8 = space();
    			form = element("form");
    			label0 = element("label");
    			t9 = text("Username\r\n          ");
    			input0 = element("input");
    			t10 = space();
    			label1 = element("label");
    			t11 = text("Password\r\n          ");
    			input1 = element("input");
    			t12 = space();
    			input2 = element("input");
    			t13 = space();
    			div1 = element("div");
    			create_component(loader1.$$.fragment);
    			t14 = space();
    			if (if_block4) if_block4.c();
    			t15 = space();
    			if (if_block5) if_block5.c();
    			t16 = space();
    			if (if_block6) if_block6.c();
    			attr_dev(h3, "class", "svelte-1pl9smk");
    			add_location(h3, file$1, 109, 8, 2825);
    			attr_dev(span, "class", "addresses-action svelte-1pl9smk");
    			add_location(span, file$1, 119, 8, 3197);
    			attr_dev(div0, "class", "address svelte-1pl9smk");
    			add_location(div0, file$1, 106, 6, 2672);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-1pl9smk");
    			add_location(input0, file$1, 138, 10, 3926);
    			add_location(label0, file$1, 137, 8, 3899);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "class", "svelte-1pl9smk");
    			add_location(input1, file$1, 141, 10, 4022);
    			add_location(label1, file$1, 140, 8, 3995);
    			attr_dev(input2, "type", "submit");
    			input2.value = "Login";
    			attr_dev(input2, "class", "svelte-1pl9smk");
    			add_location(input2, file$1, 143, 8, 4095);
    			attr_dev(div1, "class", "login-loader svelte-1pl9smk");
    			add_location(div1, file$1, 145, 8, 4185);
    			attr_dev(form, "class", "svelte-1pl9smk");
    			add_location(form, file$1, 136, 6, 3858);
    			attr_dev(div2, "class", "wrapper svelte-1pl9smk");
    			add_location(div2, file$1, 104, 4, 2641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(loader0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, h3);
    			append_dev(div0, t2);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t3);
    			append_dev(div0, span);
    			append_dev(div0, t5);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div2, t6);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t7);
    			if (if_block3) if_block3.m(div2, null);
    			append_dev(div2, t8);
    			append_dev(div2, form);
    			append_dev(form, label0);
    			append_dev(label0, t9);
    			append_dev(label0, input0);
    			set_input_value(input0, /*username*/ ctx[2]);
    			append_dev(form, t10);
    			append_dev(form, label1);
    			append_dev(label1, t11);
    			append_dev(label1, input1);
    			set_input_value(input1, /*password*/ ctx[3]);
    			append_dev(form, t12);
    			append_dev(form, input2);
    			append_dev(form, t13);
    			append_dev(form, div1);
    			mount_component(loader1, div1, null);
    			append_dev(div2, t14);
    			if (if_block4) if_block4.m(div2, null);
    			append_dev(div2, t15);
    			if (if_block5) if_block5.m(div2, null);
    			append_dev(div2, t16);
    			if (if_block6) if_block6.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span, "click", /*getAddresses*/ ctx[13], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[19]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[20]),
    					listen_dev(input2, "click", prevent_default(/*login*/ ctx[14]), false, true, false),
    					listen_dev(form, "keydown", handleEnter, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const loader0_changes = {};
    			if (dirty & /*addresses_loading*/ 256) loader0_changes.loading = /*addresses_loading*/ ctx[8];
    			if (dirty & /*addresses_error*/ 64) loader0_changes.success = !/*addresses_error*/ ctx[6];
    			loader0.$set(loader0_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, t3);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if (if_block1) if_block1.d(1);
    				if_block1 = current_block_type_1 && current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			}

    			if (/*addresses_error*/ ctx[6]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*addresses_error*/ 64) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div2, t7);
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
    					if_block3 = create_if_block_3$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div2, t8);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*username*/ 4 && input0.value !== /*username*/ ctx[2]) {
    				set_input_value(input0, /*username*/ ctx[2]);
    			}

    			if (dirty & /*password*/ 8 && input1.value !== /*password*/ ctx[3]) {
    				set_input_value(input1, /*password*/ ctx[3]);
    			}

    			const loader1_changes = {};
    			if (dirty & /*login_loading*/ 4096) loader1_changes.loading = /*login_loading*/ ctx[12];
    			loader1.$set(loader1_changes);

    			if (/*connected*/ ctx[5]) {
    				if (if_block4) {
    					if (dirty & /*connected*/ 32) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_2$1(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div2, t15);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*login_error*/ ctx[10]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty & /*login_error*/ 1024) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_1$1(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(div2, t16);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*login_hint*/ ctx[11]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty & /*login_hint*/ 2048) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block$1(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(div2, null);
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
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(loader0);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) {
    				if_block1.d();
    			}

    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_component(loader1);
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(104:2) <Box>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let box;
    	let current;

    	box = new Box({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(box.$$.fragment);
    			attr_dev(main, "class", "svelte-1pl9smk");
    			add_location(main, file$1, 102, 0, 2620);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(box, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const box_changes = {};

    			if (dirty & /*$$scope, login_hint, login_error, connected, login_loading, password, username, addresses_hint, addresses_error, addresses_form, hostname_select, addresses, hostname_input, addresses_loading*/ 67117055) {
    				box_changes.$$scope = { dirty, ctx };
    			}

    			box.$set(box_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(box);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);
    	let hostname_select;
    	let hostname_input;
    	let username;
    	let password;

    	// Predefined addresses
    	let addresses = ["192.168.1.1", "192.168.1.115"];

    	// SSH Connection status
    	let connected = 0;

    	// Obtaining addresses info
    	let addresses_error;

    	let addresses_hint;
    	let addresses_loading = false;
    	let addresses_form = "SELECT";

    	// Login info
    	let login_error;

    	let login_hint;
    	let login_loading = false;

    	async function getAddresses() {
    		$$invalidate(8, addresses_loading = true);
    		const res = await fetch("/available-addresses");

    		try {
    			const json = await res.json();

    			if (json.addresses) {
    				let new_addresses = json.addresses.filter(elem => {
    					return !addresses.includes(elem);
    				});

    				$$invalidate(4, addresses = addresses.concat(new_addresses));
    			}

    			// Replace Errors and Hints if there are new ones or empty them
    			$$invalidate(6, addresses_error = json.error ? json.error : "");

    			$$invalidate(7, addresses_hint = json.hint ? json.hint : "");
    		} catch(error) {
    			$$invalidate(6, addresses_error = error);
    		}

    		$$invalidate(8, addresses_loading = false);
    	}

    	getAddresses();

    	async function addressesToInput() {
    		$$invalidate(9, addresses_form = "INPUT");
    	}

    	async function addressesToSelect() {
    		$$invalidate(9, addresses_form = "SELECT");
    	}

    	async function login() {
    		$$invalidate(12, login_loading = true);

    		let data = {
    			// Load hostname from Select or Input field
    			hostname: addresses_form == "SELECT"
    			? addresses[hostname_select]
    			: hostname_input,
    			username,
    			password
    		};

    		// Filter out empty fields
    		for (let key in data) {
    			if (data[key] === "") {
    				data[key] = undefined;
    			}
    		}

    		console.log(JSON.stringify(data));

    		// Send data
    		const res = await fetch("/connect", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(data)
    		});

    		try {
    			const json = await res.json();
    			$$invalidate(5, connected = Boolean(json.connected));

    			// Replace Errors and Hints if there are new ones or empty them
    			$$invalidate(10, login_error = json.error ? json.error : "");

    			$$invalidate(11, login_hint = json.hint ? json.hint : "");
    		} catch(error) {
    			$$invalidate(10, login_error = error);
    		}

    		$$invalidate(12, login_loading = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Login> was created with unknown prop '${key}'`);
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
    		$$invalidate(9, addresses_form = "INPUT");
    	};

    	const click_handler_1 = () => {
    		$$invalidate(9, addresses_form = "SELECT");
    	};

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(2, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(3, password);
    	}

    	$$self.$capture_state = () => ({
    		tick,
    		slide,
    		Box,
    		Loader,
    		hostname_select,
    		hostname_input,
    		username,
    		password,
    		addresses,
    		connected,
    		addresses_error,
    		addresses_hint,
    		addresses_loading,
    		addresses_form,
    		login_error,
    		login_hint,
    		login_loading,
    		getAddresses,
    		addressesToInput,
    		addressesToSelect,
    		login,
    		handleEnter
    	});

    	$$self.$inject_state = $$props => {
    		if ("hostname_select" in $$props) $$invalidate(0, hostname_select = $$props.hostname_select);
    		if ("hostname_input" in $$props) $$invalidate(1, hostname_input = $$props.hostname_input);
    		if ("username" in $$props) $$invalidate(2, username = $$props.username);
    		if ("password" in $$props) $$invalidate(3, password = $$props.password);
    		if ("addresses" in $$props) $$invalidate(4, addresses = $$props.addresses);
    		if ("connected" in $$props) $$invalidate(5, connected = $$props.connected);
    		if ("addresses_error" in $$props) $$invalidate(6, addresses_error = $$props.addresses_error);
    		if ("addresses_hint" in $$props) $$invalidate(7, addresses_hint = $$props.addresses_hint);
    		if ("addresses_loading" in $$props) $$invalidate(8, addresses_loading = $$props.addresses_loading);
    		if ("addresses_form" in $$props) $$invalidate(9, addresses_form = $$props.addresses_form);
    		if ("login_error" in $$props) $$invalidate(10, login_error = $$props.login_error);
    		if ("login_hint" in $$props) $$invalidate(11, login_hint = $$props.login_hint);
    		if ("login_loading" in $$props) $$invalidate(12, login_loading = $$props.login_loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hostname_select,
    		hostname_input,
    		username,
    		password,
    		addresses,
    		connected,
    		addresses_error,
    		addresses_hint,
    		addresses_loading,
    		addresses_form,
    		login_error,
    		login_hint,
    		login_loading,
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

    /* src\Panels\Tests.svelte generated by Svelte v3.34.0 */

    function create_fragment$2(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tests", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tests> was created with unknown prop '${key}'`);
    	});

    	return [];
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

    /* src\Panels\Monitor.svelte generated by Svelte v3.34.0 */

    function create_fragment$1(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Monitor", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Monitor> was created with unknown prop '${key}'`);
    	});

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

    /* src\App.svelte generated by Svelte v3.34.0 */
    const file = "src\\App.svelte";

    // (21:29) 
    function create_if_block_3(ctx) {
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(21:29) ",
    		ctx
    	});

    	return block;
    }

    // (19:27) 
    function create_if_block_2(ctx) {
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(19:27) ",
    		ctx
    	});

    	return block;
    }

    // (17:0) {#if panel == 'Login'}
    function create_if_block_1(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(17:0) {#if panel == 'Login'}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import Login from './Panels/Login.svelte';   import Tests from './Panels/Tests.svelte';   import Monitor from './Panels/Monitor.svelte';     let panel = 'Login'; // Login, Tests, Monitor     async function checkConnection() {    let res = await fetch('/check-connection');    let json = await res.json()    return json.connected;   }
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import Login from './Panels/Login.svelte';   import Tests from './Panels/Tests.svelte';   import Monitor from './Panels/Monitor.svelte';     let panel = 'Login'; // Login, Tests, Monitor     async function checkConnection() {    let res = await fetch('/check-connection');    let json = await res.json()    return json.connected;   }",
    		ctx
    	});

    	return block;
    }

    // (39:1) {:then value}
    function create_then_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*value*/ ctx[5]) return create_if_block;
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
    		p: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(39:1) {:then value}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {:else}
    function create_else_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Brak połączenia";
    			attr_dev(span, "class", "fail svelte-19x6nzg");
    			add_location(span, file, 42, 3, 1085);
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
    		source: "(42:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:2) {#if value}
    function create_if_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Połączenie utrzymane";
    			attr_dev(span, "class", "success svelte-19x6nzg");
    			add_location(span, file, 40, 3, 1020);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:2) {#if value}",
    		ctx
    	});

    	return block;
    }

    // (37:19)     <span class="success">Sprawdzam...</span>   {:then value}
    function create_pending_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Sprawdzam...";
    			attr_dev(span, "class", "success svelte-19x6nzg");
    			add_location(span, file, 37, 2, 942);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(37:19)     <span class=\\\"success\\\">Sprawdzam...</span>   {:then value}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let nav;
    	let button0;
    	let t1;
    	let button0_disabled_value;
    	let t2;
    	let button1;
    	let t3;
    	let button1_disabled_value;
    	let t4;
    	let button2;
    	let t5;
    	let button2_disabled_value;
    	let t6;
    	let div;
    	let button3;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*panel*/ ctx[0] == "Login") return 0;
    		if (/*panel*/ ctx[0] == "Tests") return 1;
    		if (/*panel*/ ctx[0] == "Monitor") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 5
    	};

    	handle_promise(/*connected*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			nav = element("nav");
    			button0 = element("button");
    			t1 = text("Login");
    			t2 = space();
    			button1 = element("button");
    			t3 = text("Tests");
    			t4 = space();
    			button2 = element("button");
    			t5 = text("Monitor");
    			t6 = space();
    			div = element("div");
    			button3 = element("button");
    			button3.textContent = "Sprawdź";
    			t8 = space();
    			info.block.c();
    			button0.disabled = button0_disabled_value = /*panel*/ ctx[0] == "Login";
    			attr_dev(button0, "class", "svelte-19x6nzg");
    			add_location(button0, file, 25, 1, 534);
    			button1.disabled = button1_disabled_value = /*panel*/ ctx[0] == "Tests";
    			attr_dev(button1, "class", "svelte-19x6nzg");
    			add_location(button1, file, 27, 1, 628);
    			button2.disabled = button2_disabled_value = /*panel*/ ctx[0] == "Monitor";
    			attr_dev(button2, "class", "svelte-19x6nzg");
    			add_location(button2, file, 29, 1, 722);
    			attr_dev(nav, "class", "svelte-19x6nzg");
    			add_location(nav, file, 24, 0, 526);
    			add_location(button3, file, 35, 1, 866);
    			attr_dev(div, "class", "check-connection svelte-19x6nzg");
    			add_location(div, file, 34, 0, 833);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button0);
    			append_dev(button0, t1);
    			append_dev(nav, t2);
    			append_dev(nav, button1);
    			append_dev(button1, t3);
    			append_dev(nav, t4);
    			append_dev(nav, button2);
    			append_dev(button2, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button3);
    			append_dev(div, t8);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[4], false, false, false),
    					listen_dev(button3, "click", checkConnection, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*panel*/ 1 && button0_disabled_value !== (button0_disabled_value = /*panel*/ ctx[0] == "Login")) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (!current || dirty & /*panel*/ 1 && button1_disabled_value !== (button1_disabled_value = /*panel*/ ctx[0] == "Tests")) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (!current || dirty & /*panel*/ 1 && button2_disabled_value !== (button2_disabled_value = /*panel*/ ctx[0] == "Monitor")) {
    				prop_dev(button2, "disabled", button2_disabled_value);
    			}

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[5] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t6);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function checkConnection() {
    	let res = await fetch("/check-connection");
    	let json = await res.json();
    	return json.connected;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let panel = "Login"; // Login, Tests, Monitor
    	let connected = checkConnection();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, panel = "Login");
    	};

    	const click_handler_1 = () => {
    		$$invalidate(0, panel = "Tests");
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, panel = "Monitor");
    	};

    	$$self.$capture_state = () => ({
    		Login,
    		Tests,
    		Monitor,
    		panel,
    		checkConnection,
    		connected
    	});

    	$$self.$inject_state = $$props => {
    		if ("panel" in $$props) $$invalidate(0, panel = $$props.panel);
    		if ("connected" in $$props) $$invalidate(1, connected = $$props.connected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [panel, connected, click_handler, click_handler_1, click_handler_2];
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

    const app = new App({	target: document.body });

    return app;

}());
