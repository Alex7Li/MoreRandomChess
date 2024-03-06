var LichessDemo = (function () {
    'use strict';

    function createElement$1(tagName, options) {
        return document.createElement(tagName, options);
    }
    function createElementNS(namespaceURI, qualifiedName, options) {
        return document.createElementNS(namespaceURI, qualifiedName, options);
    }
    function createDocumentFragment() {
        return document.createDocumentFragment();
    }
    function createTextNode(text) {
        return document.createTextNode(text);
    }
    function createComment(text) {
        return document.createComment(text);
    }
    function insertBefore(parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    }
    function removeChild(node, child) {
        node.removeChild(child);
    }
    function appendChild(node, child) {
        node.appendChild(child);
    }
    function parentNode(node) {
        return node.parentNode;
    }
    function nextSibling(node) {
        return node.nextSibling;
    }
    function tagName(elm) {
        return elm.tagName;
    }
    function setTextContent(node, text) {
        node.textContent = text;
    }
    function getTextContent(node) {
        return node.textContent;
    }
    function isElement$2(node) {
        return node.nodeType === 1;
    }
    function isText(node) {
        return node.nodeType === 3;
    }
    function isComment(node) {
        return node.nodeType === 8;
    }
    function isDocumentFragment$1(node) {
        return node.nodeType === 11;
    }
    const htmlDomApi = {
        createElement: createElement$1,
        createElementNS,
        createTextNode,
        createDocumentFragment,
        createComment,
        insertBefore,
        removeChild,
        appendChild,
        parentNode,
        nextSibling,
        tagName,
        setTextContent,
        getTextContent,
        isElement: isElement$2,
        isText,
        isComment,
        isDocumentFragment: isDocumentFragment$1,
    };

    function vnode(sel, data, children, text, elm) {
        const key = data === undefined ? undefined : data.key;
        return { sel, data, children, text, elm, key };
    }

    const array = Array.isArray;
    function primitive(s) {
        return (typeof s === "string" ||
            typeof s === "number" ||
            s instanceof String ||
            s instanceof Number);
    }

    function isUndef(s) {
        return s === undefined;
    }
    function isDef(s) {
        return s !== undefined;
    }
    const emptyNode = vnode("", {}, [], undefined, undefined);
    function sameVnode(vnode1, vnode2) {
        var _a, _b;
        const isSameKey = vnode1.key === vnode2.key;
        const isSameIs = ((_a = vnode1.data) === null || _a === void 0 ? void 0 : _a.is) === ((_b = vnode2.data) === null || _b === void 0 ? void 0 : _b.is);
        const isSameSel = vnode1.sel === vnode2.sel;
        return isSameSel && isSameKey && isSameIs;
    }
    /**
     * @todo Remove this function when the document fragment is considered stable.
     */
    function documentFragmentIsNotSupported() {
        throw new Error("The document fragment is not supported on this platform.");
    }
    function isElement$1(api, vnode) {
        return api.isElement(vnode);
    }
    function isDocumentFragment(api, vnode) {
        return api.isDocumentFragment(vnode);
    }
    function createKeyToOldIdx(children, beginIdx, endIdx) {
        var _a;
        const map = {};
        for (let i = beginIdx; i <= endIdx; ++i) {
            const key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
            if (key !== undefined) {
                map[key] = i;
            }
        }
        return map;
    }
    const hooks = [
        "create",
        "update",
        "remove",
        "destroy",
        "pre",
        "post",
    ];
    function init(modules, domApi, options) {
        const cbs = {
            create: [],
            update: [],
            remove: [],
            destroy: [],
            pre: [],
            post: [],
        };
        const api = domApi !== undefined ? domApi : htmlDomApi;
        for (const hook of hooks) {
            for (const module of modules) {
                const currentHook = module[hook];
                if (currentHook !== undefined) {
                    cbs[hook].push(currentHook);
                }
            }
        }
        function emptyNodeAt(elm) {
            const id = elm.id ? "#" + elm.id : "";
            // elm.className doesn't return a string when elm is an SVG element inside a shadowRoot.
            // https://stackoverflow.com/questions/29454340/detecting-classname-of-svganimatedstring
            const classes = elm.getAttribute("class");
            const c = classes ? "." + classes.split(" ").join(".") : "";
            return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
        }
        function emptyDocumentFragmentAt(frag) {
            return vnode(undefined, {}, [], undefined, frag);
        }
        function createRmCb(childElm, listeners) {
            return function rmCb() {
                if (--listeners === 0) {
                    const parent = api.parentNode(childElm);
                    api.removeChild(parent, childElm);
                }
            };
        }
        function createElm(vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d;
            let i;
            let data = vnode.data;
            if (data !== undefined) {
                const init = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
                if (isDef(init)) {
                    init(vnode);
                    data = vnode.data;
                }
            }
            const children = vnode.children;
            const sel = vnode.sel;
            if (sel === "!") {
                if (isUndef(vnode.text)) {
                    vnode.text = "";
                }
                vnode.elm = api.createComment(vnode.text);
            }
            else if (sel !== undefined) {
                // Parse selector
                const hashIdx = sel.indexOf("#");
                const dotIdx = sel.indexOf(".", hashIdx);
                const hash = hashIdx > 0 ? hashIdx : sel.length;
                const dot = dotIdx > 0 ? dotIdx : sel.length;
                const tag = hashIdx !== -1 || dotIdx !== -1
                    ? sel.slice(0, Math.min(hash, dot))
                    : sel;
                const elm = (vnode.elm =
                    isDef(data) && isDef((i = data.ns))
                        ? api.createElementNS(i, tag, data)
                        : api.createElement(tag, data));
                if (hash < dot)
                    elm.setAttribute("id", sel.slice(hash + 1, dot));
                if (dotIdx > 0)
                    elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                if (array(children)) {
                    for (i = 0; i < children.length; ++i) {
                        const ch = children[i];
                        if (ch != null) {
                            api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                        }
                    }
                }
                else if (primitive(vnode.text)) {
                    api.appendChild(elm, api.createTextNode(vnode.text));
                }
                const hook = vnode.data.hook;
                if (isDef(hook)) {
                    (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                    if (hook.insert) {
                        insertedVnodeQueue.push(vnode);
                    }
                }
            }
            else if (((_c = options === null || options === void 0 ? void 0 : options.experimental) === null || _c === void 0 ? void 0 : _c.fragments) && vnode.children) {
                const children = vnode.children;
                vnode.elm = ((_d = api.createDocumentFragment) !== null && _d !== void 0 ? _d : documentFragmentIsNotSupported)();
                for (i = 0; i < cbs.create.length; ++i)
                    cbs.create[i](emptyNode, vnode);
                for (i = 0; i < children.length; ++i) {
                    const ch = children[i];
                    if (ch != null) {
                        api.appendChild(vnode.elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else {
                vnode.elm = api.createTextNode(vnode.text);
            }
            return vnode.elm;
        }
        function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
            for (; startIdx <= endIdx; ++startIdx) {
                const ch = vnodes[startIdx];
                if (ch != null) {
                    api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
                }
            }
        }
        function invokeDestroyHook(vnode) {
            var _a, _b;
            const data = vnode.data;
            if (data !== undefined) {
                (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
                for (let i = 0; i < cbs.destroy.length; ++i)
                    cbs.destroy[i](vnode);
                if (vnode.children !== undefined) {
                    for (let j = 0; j < vnode.children.length; ++j) {
                        const child = vnode.children[j];
                        if (child != null && typeof child !== "string") {
                            invokeDestroyHook(child);
                        }
                    }
                }
            }
        }
        function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
            var _a, _b;
            for (; startIdx <= endIdx; ++startIdx) {
                let listeners;
                let rm;
                const ch = vnodes[startIdx];
                if (ch != null) {
                    if (isDef(ch.sel)) {
                        invokeDestroyHook(ch);
                        listeners = cbs.remove.length + 1;
                        rm = createRmCb(ch.elm, listeners);
                        for (let i = 0; i < cbs.remove.length; ++i)
                            cbs.remove[i](ch, rm);
                        const removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                        if (isDef(removeHook)) {
                            removeHook(ch, rm);
                        }
                        else {
                            rm();
                        }
                    }
                    else {
                        // Text node
                        api.removeChild(parentElm, ch.elm);
                    }
                }
            }
        }
        function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
            let oldStartIdx = 0;
            let newStartIdx = 0;
            let oldEndIdx = oldCh.length - 1;
            let oldStartVnode = oldCh[0];
            let oldEndVnode = oldCh[oldEndIdx];
            let newEndIdx = newCh.length - 1;
            let newStartVnode = newCh[0];
            let newEndVnode = newCh[newEndIdx];
            let oldKeyToIdx;
            let idxInOld;
            let elmToMove;
            let before;
            while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                if (oldStartVnode == null) {
                    oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
                }
                else if (oldEndVnode == null) {
                    oldEndVnode = oldCh[--oldEndIdx];
                }
                else if (newStartVnode == null) {
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (newEndVnode == null) {
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newStartVnode)) {
                    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                    oldStartVnode = oldCh[++oldStartIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else if (sameVnode(oldEndVnode, newEndVnode)) {
                    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldStartVnode, newEndVnode)) {
                    // Vnode moved right
                    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                    oldStartVnode = oldCh[++oldStartIdx];
                    newEndVnode = newCh[--newEndIdx];
                }
                else if (sameVnode(oldEndVnode, newStartVnode)) {
                    // Vnode moved left
                    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                    api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                    oldEndVnode = oldCh[--oldEndIdx];
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    if (oldKeyToIdx === undefined) {
                        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                    }
                    idxInOld = oldKeyToIdx[newStartVnode.key];
                    if (isUndef(idxInOld)) {
                        // New element
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        elmToMove = oldCh[idxInOld];
                        if (elmToMove.sel !== newStartVnode.sel) {
                            api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                        }
                        else {
                            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                            oldCh[idxInOld] = undefined;
                            api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                        }
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
            if (newStartIdx <= newEndIdx) {
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            if (oldStartIdx <= oldEndIdx) {
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
        function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
            var _a, _b, _c, _d, _e;
            const hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
            (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
            const elm = (vnode.elm = oldVnode.elm);
            const oldCh = oldVnode.children;
            const ch = vnode.children;
            if (oldVnode === vnode)
                return;
            if (vnode.data !== undefined) {
                for (let i = 0; i < cbs.update.length; ++i)
                    cbs.update[i](oldVnode, vnode);
                (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
            }
            if (isUndef(vnode.text)) {
                if (isDef(oldCh) && isDef(ch)) {
                    if (oldCh !== ch)
                        updateChildren(elm, oldCh, ch, insertedVnodeQueue);
                }
                else if (isDef(ch)) {
                    if (isDef(oldVnode.text))
                        api.setTextContent(elm, "");
                    addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                }
                else if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                else if (isDef(oldVnode.text)) {
                    api.setTextContent(elm, "");
                }
            }
            else if (oldVnode.text !== vnode.text) {
                if (isDef(oldCh)) {
                    removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                }
                api.setTextContent(elm, vnode.text);
            }
            (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
        }
        return function patch(oldVnode, vnode) {
            let i, elm, parent;
            const insertedVnodeQueue = [];
            for (i = 0; i < cbs.pre.length; ++i)
                cbs.pre[i]();
            if (isElement$1(api, oldVnode)) {
                oldVnode = emptyNodeAt(oldVnode);
            }
            else if (isDocumentFragment(api, oldVnode)) {
                oldVnode = emptyDocumentFragmentAt(oldVnode);
            }
            if (sameVnode(oldVnode, vnode)) {
                patchVnode(oldVnode, vnode, insertedVnodeQueue);
            }
            else {
                elm = oldVnode.elm;
                parent = api.parentNode(elm);
                createElm(vnode, insertedVnodeQueue);
                if (parent !== null) {
                    api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                    removeVnodes(parent, [oldVnode], 0, 0);
                }
            }
            for (i = 0; i < insertedVnodeQueue.length; ++i) {
                insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
            }
            for (i = 0; i < cbs.post.length; ++i)
                cbs.post[i]();
            return vnode;
        };
    }

    function addNS(data, children, sel) {
        data.ns = "http://www.w3.org/2000/svg";
        if (sel !== "foreignObject" && children !== undefined) {
            for (let i = 0; i < children.length; ++i) {
                const child = children[i];
                if (typeof child === "string")
                    continue;
                const childData = child.data;
                if (childData !== undefined) {
                    addNS(childData, child.children, child.sel);
                }
            }
        }
    }
    function h(sel, b, c) {
        let data = {};
        let children;
        let text;
        let i;
        if (c !== undefined) {
            if (b !== null) {
                data = b;
            }
            if (array(c)) {
                children = c;
            }
            else if (primitive(c)) {
                text = c.toString();
            }
            else if (c && c.sel) {
                children = [c];
            }
        }
        else if (b !== undefined && b !== null) {
            if (array(b)) {
                children = b;
            }
            else if (primitive(b)) {
                text = b.toString();
            }
            else if (b && b.sel) {
                children = [b];
            }
            else {
                data = b;
            }
        }
        if (children !== undefined) {
            for (i = 0; i < children.length; ++i) {
                if (primitive(children[i]))
                    children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
            }
        }
        if (sel[0] === "s" &&
            sel[1] === "v" &&
            sel[2] === "g" &&
            (sel.length === 3 || sel[3] === "." || sel[3] === "#")) {
            addNS(data, children, sel);
        }
        return vnode(sel, data, children, text, undefined);
    }

    const xlinkNS = "http://www.w3.org/1999/xlink";
    const xmlNS = "http://www.w3.org/XML/1998/namespace";
    const colonChar = 58;
    const xChar = 120;
    function updateAttrs(oldVnode, vnode) {
        let key;
        const elm = vnode.elm;
        let oldAttrs = oldVnode.data.attrs;
        let attrs = vnode.data.attrs;
        if (!oldAttrs && !attrs)
            return;
        if (oldAttrs === attrs)
            return;
        oldAttrs = oldAttrs || {};
        attrs = attrs || {};
        // update modified attributes, add new attributes
        for (key in attrs) {
            const cur = attrs[key];
            const old = oldAttrs[key];
            if (old !== cur) {
                if (cur === true) {
                    elm.setAttribute(key, "");
                }
                else if (cur === false) {
                    elm.removeAttribute(key);
                }
                else {
                    if (key.charCodeAt(0) !== xChar) {
                        elm.setAttribute(key, cur);
                    }
                    else if (key.charCodeAt(3) === colonChar) {
                        // Assume xml namespace
                        elm.setAttributeNS(xmlNS, key, cur);
                    }
                    else if (key.charCodeAt(5) === colonChar) {
                        // Assume xlink namespace
                        elm.setAttributeNS(xlinkNS, key, cur);
                    }
                    else {
                        elm.setAttribute(key, cur);
                    }
                }
            }
        }
        // remove removed attributes
        // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
        // the other option is to remove all attributes with value == undefined
        for (key in oldAttrs) {
            if (!(key in attrs)) {
                elm.removeAttribute(key);
            }
        }
    }
    const attributesModule = {
        create: updateAttrs,
        update: updateAttrs,
    };

    function updateClass(oldVnode, vnode) {
        let cur;
        let name;
        const elm = vnode.elm;
        let oldClass = oldVnode.data.class;
        let klass = vnode.data.class;
        if (!oldClass && !klass)
            return;
        if (oldClass === klass)
            return;
        oldClass = oldClass || {};
        klass = klass || {};
        for (name in oldClass) {
            if (oldClass[name] && !Object.prototype.hasOwnProperty.call(klass, name)) {
                // was `true` and now not provided
                elm.classList.remove(name);
            }
        }
        for (name in klass) {
            cur = klass[name];
            if (cur !== oldClass[name]) {
                elm.classList[cur ? "add" : "remove"](name);
            }
        }
    }
    const classModule = { create: updateClass, update: updateClass };

    function invokeHandler(handler, vnode, event) {
        if (typeof handler === "function") {
            // call function handler
            handler.call(vnode, event, vnode);
        }
        else if (typeof handler === "object") {
            // call multiple handlers
            for (let i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], vnode, event);
            }
        }
    }
    function handleEvent(event, vnode) {
        const name = event.type;
        const on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], vnode, event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        const oldOn = oldVnode.data.on;
        const oldListener = oldVnode.listener;
        const oldElm = oldVnode.elm;
        const on = vnode && vnode.data.on;
        const elm = (vnode && vnode.elm);
        let name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            const listener = (vnode.listener =
                oldVnode.listener || createListener());
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    const eventListenersModule = {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners,
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    var oauth2AuthCodePkce = {};

    (function (exports) {
    /**
     * An implementation of rfc6749#section-4.1 and rfc7636.
     */
    var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __spreadArrays = (commonjsGlobal && commonjsGlobal.__spreadArrays) || function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A list of OAuth2AuthCodePKCE errors.
     */
    // To "namespace" all errors.
    var ErrorOAuth2 = /** @class */ (function () {
        function ErrorOAuth2() {
        }
        ErrorOAuth2.prototype.toString = function () { return 'ErrorOAuth2'; };
        return ErrorOAuth2;
    }());
    exports.ErrorOAuth2 = ErrorOAuth2;
    // For really unknown errors.
    var ErrorUnknown = /** @class */ (function (_super) {
        __extends(ErrorUnknown, _super);
        function ErrorUnknown() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnknown.prototype.toString = function () { return 'ErrorUnknown'; };
        return ErrorUnknown;
    }(ErrorOAuth2));
    exports.ErrorUnknown = ErrorUnknown;
    // Some generic, internal errors that can happen.
    var ErrorNoAuthCode = /** @class */ (function (_super) {
        __extends(ErrorNoAuthCode, _super);
        function ErrorNoAuthCode() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorNoAuthCode.prototype.toString = function () { return 'ErrorNoAuthCode'; };
        return ErrorNoAuthCode;
    }(ErrorOAuth2));
    exports.ErrorNoAuthCode = ErrorNoAuthCode;
    var ErrorInvalidReturnedStateParam = /** @class */ (function (_super) {
        __extends(ErrorInvalidReturnedStateParam, _super);
        function ErrorInvalidReturnedStateParam() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidReturnedStateParam.prototype.toString = function () { return 'ErrorInvalidReturnedStateParam'; };
        return ErrorInvalidReturnedStateParam;
    }(ErrorOAuth2));
    exports.ErrorInvalidReturnedStateParam = ErrorInvalidReturnedStateParam;
    var ErrorInvalidJson = /** @class */ (function (_super) {
        __extends(ErrorInvalidJson, _super);
        function ErrorInvalidJson() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidJson.prototype.toString = function () { return 'ErrorInvalidJson'; };
        return ErrorInvalidJson;
    }(ErrorOAuth2));
    exports.ErrorInvalidJson = ErrorInvalidJson;
    // Errors that occur across many endpoints
    var ErrorInvalidScope = /** @class */ (function (_super) {
        __extends(ErrorInvalidScope, _super);
        function ErrorInvalidScope() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidScope.prototype.toString = function () { return 'ErrorInvalidScope'; };
        return ErrorInvalidScope;
    }(ErrorOAuth2));
    exports.ErrorInvalidScope = ErrorInvalidScope;
    var ErrorInvalidRequest = /** @class */ (function (_super) {
        __extends(ErrorInvalidRequest, _super);
        function ErrorInvalidRequest() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidRequest.prototype.toString = function () { return 'ErrorInvalidRequest'; };
        return ErrorInvalidRequest;
    }(ErrorOAuth2));
    exports.ErrorInvalidRequest = ErrorInvalidRequest;
    var ErrorInvalidToken = /** @class */ (function (_super) {
        __extends(ErrorInvalidToken, _super);
        function ErrorInvalidToken() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidToken.prototype.toString = function () { return 'ErrorInvalidToken'; };
        return ErrorInvalidToken;
    }(ErrorOAuth2));
    exports.ErrorInvalidToken = ErrorInvalidToken;
    /**
     * Possible authorization grant errors given by the redirection from the
     * authorization server.
     */
    var ErrorAuthenticationGrant = /** @class */ (function (_super) {
        __extends(ErrorAuthenticationGrant, _super);
        function ErrorAuthenticationGrant() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorAuthenticationGrant.prototype.toString = function () { return 'ErrorAuthenticationGrant'; };
        return ErrorAuthenticationGrant;
    }(ErrorOAuth2));
    exports.ErrorAuthenticationGrant = ErrorAuthenticationGrant;
    var ErrorUnauthorizedClient = /** @class */ (function (_super) {
        __extends(ErrorUnauthorizedClient, _super);
        function ErrorUnauthorizedClient() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnauthorizedClient.prototype.toString = function () { return 'ErrorUnauthorizedClient'; };
        return ErrorUnauthorizedClient;
    }(ErrorAuthenticationGrant));
    exports.ErrorUnauthorizedClient = ErrorUnauthorizedClient;
    var ErrorAccessDenied = /** @class */ (function (_super) {
        __extends(ErrorAccessDenied, _super);
        function ErrorAccessDenied() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorAccessDenied.prototype.toString = function () { return 'ErrorAccessDenied'; };
        return ErrorAccessDenied;
    }(ErrorAuthenticationGrant));
    exports.ErrorAccessDenied = ErrorAccessDenied;
    var ErrorUnsupportedResponseType = /** @class */ (function (_super) {
        __extends(ErrorUnsupportedResponseType, _super);
        function ErrorUnsupportedResponseType() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnsupportedResponseType.prototype.toString = function () { return 'ErrorUnsupportedResponseType'; };
        return ErrorUnsupportedResponseType;
    }(ErrorAuthenticationGrant));
    exports.ErrorUnsupportedResponseType = ErrorUnsupportedResponseType;
    var ErrorServerError = /** @class */ (function (_super) {
        __extends(ErrorServerError, _super);
        function ErrorServerError() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorServerError.prototype.toString = function () { return 'ErrorServerError'; };
        return ErrorServerError;
    }(ErrorAuthenticationGrant));
    exports.ErrorServerError = ErrorServerError;
    var ErrorTemporarilyUnavailable = /** @class */ (function (_super) {
        __extends(ErrorTemporarilyUnavailable, _super);
        function ErrorTemporarilyUnavailable() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorTemporarilyUnavailable.prototype.toString = function () { return 'ErrorTemporarilyUnavailable'; };
        return ErrorTemporarilyUnavailable;
    }(ErrorAuthenticationGrant));
    exports.ErrorTemporarilyUnavailable = ErrorTemporarilyUnavailable;
    /**
     * A list of possible access token response errors.
     */
    var ErrorAccessTokenResponse = /** @class */ (function (_super) {
        __extends(ErrorAccessTokenResponse, _super);
        function ErrorAccessTokenResponse() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorAccessTokenResponse.prototype.toString = function () { return 'ErrorAccessTokenResponse'; };
        return ErrorAccessTokenResponse;
    }(ErrorOAuth2));
    exports.ErrorAccessTokenResponse = ErrorAccessTokenResponse;
    var ErrorInvalidClient = /** @class */ (function (_super) {
        __extends(ErrorInvalidClient, _super);
        function ErrorInvalidClient() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidClient.prototype.toString = function () { return 'ErrorInvalidClient'; };
        return ErrorInvalidClient;
    }(ErrorAccessTokenResponse));
    exports.ErrorInvalidClient = ErrorInvalidClient;
    var ErrorInvalidGrant = /** @class */ (function (_super) {
        __extends(ErrorInvalidGrant, _super);
        function ErrorInvalidGrant() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorInvalidGrant.prototype.toString = function () { return 'ErrorInvalidGrant'; };
        return ErrorInvalidGrant;
    }(ErrorAccessTokenResponse));
    exports.ErrorInvalidGrant = ErrorInvalidGrant;
    var ErrorUnsupportedGrantType = /** @class */ (function (_super) {
        __extends(ErrorUnsupportedGrantType, _super);
        function ErrorUnsupportedGrantType() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ErrorUnsupportedGrantType.prototype.toString = function () { return 'ErrorUnsupportedGrantType'; };
        return ErrorUnsupportedGrantType;
    }(ErrorAccessTokenResponse));
    exports.ErrorUnsupportedGrantType = ErrorUnsupportedGrantType;
    /**
     * WWW-Authenticate error object structure for less error prone handling.
     */
    var ErrorWWWAuthenticate = /** @class */ (function () {
        function ErrorWWWAuthenticate() {
            this.realm = "";
            this.error = "";
        }
        return ErrorWWWAuthenticate;
    }());
    exports.ErrorWWWAuthenticate = ErrorWWWAuthenticate;
    exports.RawErrorToErrorClassMap = {
        invalid_request: ErrorInvalidRequest,
        invalid_grant: ErrorInvalidGrant,
        unauthorized_client: ErrorUnauthorizedClient,
        access_denied: ErrorAccessDenied,
        unsupported_response_type: ErrorUnsupportedResponseType,
        invalid_scope: ErrorInvalidScope,
        server_error: ErrorServerError,
        temporarily_unavailable: ErrorTemporarilyUnavailable,
        invalid_client: ErrorInvalidClient,
        unsupported_grant_type: ErrorUnsupportedGrantType,
        invalid_json: ErrorInvalidJson,
        invalid_token: ErrorInvalidToken,
    };
    /**
     * Translate the raw error strings returned from the server into error classes.
     */
    function toErrorClass(rawError) {
        return new (exports.RawErrorToErrorClassMap[rawError] || ErrorUnknown)();
    }
    exports.toErrorClass = toErrorClass;
    /**
     * A convience function to turn, for example, `Bearer realm="bity.com",
     * error="invalid_client"` into `{ realm: "bity.com", error: "invalid_client"
     * }`.
     */
    function fromWWWAuthenticateHeaderStringToObject(a) {
        var obj = a
            .slice("Bearer ".length)
            .replace(/"/g, '')
            .split(', ')
            .map(function (tokens) {
            var _a;
            var _b = tokens.split('='), k = _b[0], v = _b[1];
            return _a = {}, _a[k] = v, _a;
        })
            .reduce(function (a, c) { return (__assign(__assign({}, a), c)); }, {});
        return { realm: obj.realm, error: obj.error };
    }
    exports.fromWWWAuthenticateHeaderStringToObject = fromWWWAuthenticateHeaderStringToObject;
    /**
     * HTTP headers that we need to access.
     */
    var HEADER_AUTHORIZATION = "Authorization";
    var HEADER_WWW_AUTHENTICATE = "WWW-Authenticate";
    /**
     * To store the OAuth client's data between websites due to redirection.
     */
    exports.LOCALSTORAGE_ID = "oauth2authcodepkce";
    exports.LOCALSTORAGE_STATE = exports.LOCALSTORAGE_ID + "-state";
    /**
     * The maximum length for a code verifier for the best security we can offer.
     * Please note the NOTE section of RFC 7636 § 4.1 - the length must be >= 43,
     * but <= 128, **after** base64 url encoding. This means 32 code verifier bytes
     * encoded will be 43 bytes, or 96 bytes encoded will be 128 bytes. So 96 bytes
     * is the highest valid value that can be used.
     */
    exports.RECOMMENDED_CODE_VERIFIER_LENGTH = 96;
    /**
     * A sensible length for the state's length, for anti-csrf.
     */
    exports.RECOMMENDED_STATE_LENGTH = 32;
    /**
     * Character set to generate code verifier defined in rfc7636.
     */
    var PKCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    /**
     * OAuth 2.0 client that ONLY supports authorization code flow, with PKCE.
     *
     * Many applications structure their OAuth usage in different ways. This class
     * aims to provide both flexible and easy ways to use this configuration of
     * OAuth.
     *
     * See `example.ts` for how you'd typically use this.
     *
     * For others, review this class's methods.
     */
    var OAuth2AuthCodePKCE = /** @class */ (function () {
        function OAuth2AuthCodePKCE(config) {
            this.state = {};
            this.config = config;
            this.recoverState();
            return this;
        }
        /**
         * Attach the OAuth logic to all fetch requests and translate errors (either
         * returned as json or through the WWW-Authenticate header) into nice error
         * classes.
         */
        OAuth2AuthCodePKCE.prototype.decorateFetchHTTPClient = function (fetch) {
            var _this = this;
            return function (url, config) {
                var rest = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    rest[_i - 2] = arguments[_i];
                }
                if (!_this.state.isHTTPDecoratorActive) {
                    return fetch.apply(void 0, __spreadArrays([url, config], rest));
                }
                return _this
                    .getAccessToken()
                    .then(function (_a) {
                    var token = _a.token;
                    var configNew = Object.assign({}, config);
                    if (!configNew.headers) {
                        configNew.headers = {};
                    }
                    configNew.headers[HEADER_AUTHORIZATION] = "Bearer " + token.value;
                    return fetch.apply(void 0, __spreadArrays([url, configNew], rest));
                })
                    .then(function (res) {
                    if (res.ok) {
                        return res;
                    }
                    if (!res.headers.has(HEADER_WWW_AUTHENTICATE.toLowerCase())) {
                        return res;
                    }
                    var error = toErrorClass(fromWWWAuthenticateHeaderStringToObject(res.headers.get(HEADER_WWW_AUTHENTICATE.toLowerCase())).error);
                    if (error instanceof ErrorInvalidToken) {
                        _this.config
                            .onAccessTokenExpiry(function () { return _this.exchangeRefreshTokenForAccessToken(); });
                    }
                    return Promise.reject(error);
                });
            };
        };
        /**
         * If there is an error, it will be passed back as a rejected Promise.
         * If there is no code, the user should be redirected via
         * [fetchAuthorizationCode].
         */
        OAuth2AuthCodePKCE.prototype.isReturningFromAuthServer = function () {
            var error = OAuth2AuthCodePKCE.extractParamFromUrl(location.href, 'error');
            if (error) {
                return Promise.reject(toErrorClass(error));
            }
            var code = OAuth2AuthCodePKCE.extractParamFromUrl(location.href, 'code');
            if (!code) {
                return Promise.resolve(false);
            }
            var state = JSON.parse(localStorage.getItem(exports.LOCALSTORAGE_STATE) || '{}');
            var stateQueryParam = OAuth2AuthCodePKCE.extractParamFromUrl(location.href, 'state');
            if (stateQueryParam !== state.stateQueryParam) {
                console.warn("state query string parameter doesn't match the one sent! Possible malicious activity somewhere.");
                return Promise.reject(new ErrorInvalidReturnedStateParam());
            }
            state.authorizationCode = code;
            state.hasAuthCodeBeenExchangedForAccessToken = false;
            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(state));
            this.setState(state);
            return Promise.resolve(true);
        };
        /**
         * Fetch an authorization grant via redirection. In a sense this function
         * doesn't return because of the redirect behavior (uses `location.replace`).
         *
         * @param oneTimeParams A way to specify "one time" used query string
         * parameters during the authorization code fetching process, usually for
         * values which need to change at run-time.
         */
        OAuth2AuthCodePKCE.prototype.fetchAuthorizationCode = function (oneTimeParams) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, clientId, extraAuthorizationParams, redirectUrl, scopes, _b, codeChallenge, codeVerifier, stateQueryParam, url, extraParameters;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            this.assertStateAndConfigArePresent();
                            _a = this.config, clientId = _a.clientId, extraAuthorizationParams = _a.extraAuthorizationParams, redirectUrl = _a.redirectUrl, scopes = _a.scopes;
                            return [4 /*yield*/, OAuth2AuthCodePKCE
                                    .generatePKCECodes()];
                        case 1:
                            _b = _c.sent(), codeChallenge = _b.codeChallenge, codeVerifier = _b.codeVerifier;
                            stateQueryParam = OAuth2AuthCodePKCE
                                .generateRandomState(exports.RECOMMENDED_STATE_LENGTH);
                            this.state = __assign(__assign({}, this.state), { codeChallenge: codeChallenge,
                                codeVerifier: codeVerifier,
                                stateQueryParam: stateQueryParam, isHTTPDecoratorActive: true });
                            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(this.state));
                            url = this.config.authorizationUrl
                                + "?response_type=code&"
                                + ("client_id=" + encodeURIComponent(clientId) + "&")
                                + ("redirect_uri=" + encodeURIComponent(redirectUrl) + "&")
                                + ("scope=" + encodeURIComponent(scopes.join(' ')) + "&")
                                + ("state=" + stateQueryParam + "&")
                                + ("code_challenge=" + encodeURIComponent(codeChallenge) + "&")
                                + "code_challenge_method=S256";
                            if (extraAuthorizationParams || oneTimeParams) {
                                extraParameters = __assign(__assign({}, extraAuthorizationParams), oneTimeParams);
                                url = url + "&" + OAuth2AuthCodePKCE.objectToQueryString(extraParameters);
                            }
                            location.replace(url);
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Tries to get the current access token. If there is none
         * it will fetch another one. If it is expired, it will fire
         * [onAccessTokenExpiry] but it's up to the user to call the refresh token
         * function. This is because sometimes not using the refresh token facilities
         * is easier.
         */
        OAuth2AuthCodePKCE.prototype.getAccessToken = function () {
            var _this = this;
            this.assertStateAndConfigArePresent();
            var onAccessTokenExpiry = this.config.onAccessTokenExpiry;
            var _a = this.state, accessToken = _a.accessToken, authorizationCode = _a.authorizationCode, explicitlyExposedTokens = _a.explicitlyExposedTokens, hasAuthCodeBeenExchangedForAccessToken = _a.hasAuthCodeBeenExchangedForAccessToken, refreshToken = _a.refreshToken, scopes = _a.scopes;
            if (!authorizationCode) {
                return Promise.reject(new ErrorNoAuthCode());
            }
            if (this.authCodeForAccessTokenRequest) {
                return this.authCodeForAccessTokenRequest;
            }
            if (!this.isAuthorized() || !hasAuthCodeBeenExchangedForAccessToken) {
                this.authCodeForAccessTokenRequest = this.exchangeAuthCodeForAccessToken();
                return this.authCodeForAccessTokenRequest;
            }
            // Depending on the server (and config), refreshToken may not be available.
            if (refreshToken && this.isAccessTokenExpired()) {
                return onAccessTokenExpiry(function () { return _this.exchangeRefreshTokenForAccessToken(); });
            }
            return Promise.resolve({
                token: accessToken,
                explicitlyExposedTokens: explicitlyExposedTokens,
                scopes: scopes,
                refreshToken: refreshToken
            });
        };
        /**
         * Refresh an access token from the remote service.
         */
        OAuth2AuthCodePKCE.prototype.exchangeRefreshTokenForAccessToken = function () {
            var _this = this;
            var _a;
            this.assertStateAndConfigArePresent();
            var _b = this.config, extraRefreshParams = _b.extraRefreshParams, clientId = _b.clientId, tokenUrl = _b.tokenUrl;
            var refreshToken = this.state.refreshToken;
            if (!refreshToken) {
                console.warn('No refresh token is present.');
            }
            var url = tokenUrl;
            var body = "grant_type=refresh_token&"
                + ("refresh_token=" + ((_a = refreshToken) === null || _a === void 0 ? void 0 : _a.value) + "&")
                + ("client_id=" + clientId);
            if (extraRefreshParams) {
                body = url + "&" + OAuth2AuthCodePKCE.objectToQueryString(extraRefreshParams);
            }
            return fetch(url, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .then(function (res) { return res.status >= 400 ? res.json().then(function (data) { return Promise.reject(data); }) : res.json(); })
                .then(function (json) {
                var access_token = json.access_token, expires_in = json.expires_in, refresh_token = json.refresh_token, scope = json.scope;
                var explicitlyExposedTokens = _this.config.explicitlyExposedTokens;
                var scopes = [];
                var tokensToExpose = {};
                var accessToken = {
                    value: access_token,
                    expiry: (new Date(Date.now() + (parseInt(expires_in) * 1000))).toString()
                };
                _this.state.accessToken = accessToken;
                if (refresh_token) {
                    var refreshToken_1 = {
                        value: refresh_token
                    };
                    _this.state.refreshToken = refreshToken_1;
                }
                if (explicitlyExposedTokens) {
                    tokensToExpose = Object.fromEntries(explicitlyExposedTokens
                        .map(function (tokenName) { return [tokenName, json[tokenName]]; })
                        .filter(function (_a) {
                        _a[0]; var tokenValue = _a[1];
                        return tokenValue !== undefined;
                    }));
                    _this.state.explicitlyExposedTokens = tokensToExpose;
                }
                if (scope) {
                    // Multiple scopes are passed and delimited by spaces,
                    // despite using the singular name "scope".
                    scopes = scope.split(' ');
                    _this.state.scopes = scopes;
                }
                localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(_this.state));
                var accessContext = { token: accessToken, scopes: scopes };
                if (explicitlyExposedTokens) {
                    accessContext.explicitlyExposedTokens = tokensToExpose;
                }
                return accessContext;
            })
                .catch(function (data) {
                var onInvalidGrant = _this.config.onInvalidGrant;
                var error = data.error || 'There was a network error.';
                switch (error) {
                    case 'invalid_grant':
                        onInvalidGrant(function () { return _this.fetchAuthorizationCode(); });
                        break;
                }
                return Promise.reject(toErrorClass(error));
            });
        };
        /**
         * Get the scopes that were granted by the authorization server.
         */
        OAuth2AuthCodePKCE.prototype.getGrantedScopes = function () {
            return this.state.scopes;
        };
        /**
         * Signals if OAuth HTTP decorating should be active or not.
         */
        OAuth2AuthCodePKCE.prototype.isHTTPDecoratorActive = function (isActive) {
            this.state.isHTTPDecoratorActive = isActive;
            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(this.state));
        };
        /**
         * Tells if the client is authorized or not. This means the client has at
         * least once successfully fetched an access token. The access token could be
         * expired.
         */
        OAuth2AuthCodePKCE.prototype.isAuthorized = function () {
            return !!this.state.accessToken;
        };
        /**
         * Checks to see if the access token has expired.
         */
        OAuth2AuthCodePKCE.prototype.isAccessTokenExpired = function () {
            var accessToken = this.state.accessToken;
            return Boolean(accessToken && (new Date()) >= (new Date(accessToken.expiry)));
        };
        /**
         * Resets the state of the client. Equivalent to "logging out" the user.
         */
        OAuth2AuthCodePKCE.prototype.reset = function () {
            this.setState({});
            this.authCodeForAccessTokenRequest = undefined;
        };
        /**
         * If the state or config are missing, it means the client is in a bad state.
         * This should never happen, but the check is there just in case.
         */
        OAuth2AuthCodePKCE.prototype.assertStateAndConfigArePresent = function () {
            if (!this.state || !this.config) {
                console.error('state:', this.state, 'config:', this.config);
                throw new Error('state or config is not set.');
            }
        };
        /**
         * Fetch an access token from the remote service. You may pass a custom
         * authorization grant code for any reason, but this is non-standard usage.
         */
        OAuth2AuthCodePKCE.prototype.exchangeAuthCodeForAccessToken = function (codeOverride) {
            var _this = this;
            this.assertStateAndConfigArePresent();
            var _a = this.state, _b = _a.authorizationCode, authorizationCode = _b === void 0 ? codeOverride : _b, _c = _a.codeVerifier, codeVerifier = _c === void 0 ? '' : _c;
            var _d = this.config, clientId = _d.clientId, onInvalidGrant = _d.onInvalidGrant, redirectUrl = _d.redirectUrl;
            if (!codeVerifier) {
                console.warn('No code verifier is being sent.');
            }
            else if (!authorizationCode) {
                console.warn('No authorization grant code is being passed.');
            }
            var url = this.config.tokenUrl;
            var body = "grant_type=authorization_code&"
                + ("code=" + encodeURIComponent(authorizationCode || '') + "&")
                + ("redirect_uri=" + encodeURIComponent(redirectUrl) + "&")
                + ("client_id=" + encodeURIComponent(clientId) + "&")
                + ("code_verifier=" + codeVerifier);
            return fetch(url, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
                .then(function (res) {
                var jsonPromise = res.json()
                    .catch(function (_) { return ({ error: 'invalid_json' }); });
                if (!res.ok) {
                    return jsonPromise.then(function (_a) {
                        var error = _a.error;
                        switch (error) {
                            case 'invalid_grant':
                                onInvalidGrant(function () { return _this.fetchAuthorizationCode(); });
                                break;
                        }
                        return Promise.reject(toErrorClass(error));
                    });
                }
                return jsonPromise.then(function (json) {
                    var access_token = json.access_token, expires_in = json.expires_in, refresh_token = json.refresh_token, scope = json.scope;
                    var explicitlyExposedTokens = _this.config.explicitlyExposedTokens;
                    var scopes = [];
                    var tokensToExpose = {};
                    _this.state.hasAuthCodeBeenExchangedForAccessToken = true;
                    _this.authCodeForAccessTokenRequest = undefined;
                    var accessToken = {
                        value: access_token,
                        expiry: (new Date(Date.now() + (parseInt(expires_in) * 1000))).toString()
                    };
                    _this.state.accessToken = accessToken;
                    if (refresh_token) {
                        var refreshToken = {
                            value: refresh_token
                        };
                        _this.state.refreshToken = refreshToken;
                    }
                    if (explicitlyExposedTokens) {
                        tokensToExpose = Object.fromEntries(explicitlyExposedTokens
                            .map(function (tokenName) { return [tokenName, json[tokenName]]; })
                            .filter(function (_a) {
                            _a[0]; var tokenValue = _a[1];
                            return tokenValue !== undefined;
                        }));
                        _this.state.explicitlyExposedTokens = tokensToExpose;
                    }
                    if (scope) {
                        // Multiple scopes are passed and delimited by spaces,
                        // despite using the singular name "scope".
                        scopes = scope.split(' ');
                        _this.state.scopes = scopes;
                    }
                    localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(_this.state));
                    var accessContext = { token: accessToken, scopes: scopes };
                    if (explicitlyExposedTokens) {
                        accessContext.explicitlyExposedTokens = tokensToExpose;
                    }
                    return accessContext;
                });
            });
        };
        OAuth2AuthCodePKCE.prototype.recoverState = function () {
            this.state = JSON.parse(localStorage.getItem(exports.LOCALSTORAGE_STATE) || '{}');
            return this;
        };
        OAuth2AuthCodePKCE.prototype.setState = function (state) {
            this.state = state;
            localStorage.setItem(exports.LOCALSTORAGE_STATE, JSON.stringify(state));
            return this;
        };
        /**
         * Implements *base64url-encode* (RFC 4648 § 5) without padding, which is NOT
         * the same as regular base64 encoding.
         */
        OAuth2AuthCodePKCE.base64urlEncode = function (value) {
            var base64 = btoa(value);
            base64 = base64.replace(/\+/g, '-');
            base64 = base64.replace(/\//g, '_');
            base64 = base64.replace(/=/g, '');
            return base64;
        };
        /**
         * Extracts a query string parameter.
         */
        OAuth2AuthCodePKCE.extractParamFromUrl = function (url, param) {
            var queryString = url.split('?');
            if (queryString.length < 2) {
                return '';
            }
            // Account for hash URLs that SPAs usually use.
            queryString = queryString[1].split('#');
            var parts = queryString[0]
                .split('&')
                .reduce(function (a, s) { return a.concat(s.split('=')); }, []);
            if (parts.length < 2) {
                return '';
            }
            var paramIdx = parts.indexOf(param);
            return decodeURIComponent(paramIdx >= 0 ? parts[paramIdx + 1] : '');
        };
        /**
         * Converts the keys and values of an object to a url query string
         */
        OAuth2AuthCodePKCE.objectToQueryString = function (dict) {
            return Object.entries(dict).map(function (_a) {
                var key = _a[0], val = _a[1];
                return key + "=" + encodeURIComponent(val);
            }).join('&');
        };
        /**
         * Generates a code_verifier and code_challenge, as specified in rfc7636.
         */
        OAuth2AuthCodePKCE.generatePKCECodes = function () {
            var output = new Uint32Array(exports.RECOMMENDED_CODE_VERIFIER_LENGTH);
            crypto.getRandomValues(output);
            var codeVerifier = OAuth2AuthCodePKCE.base64urlEncode(Array
                .from(output)
                .map(function (num) { return PKCE_CHARSET[num % PKCE_CHARSET.length]; })
                .join(''));
            return crypto
                .subtle
                .digest('SHA-256', (new TextEncoder()).encode(codeVerifier))
                .then(function (buffer) {
                var hash = new Uint8Array(buffer);
                var binary = '';
                var hashLength = hash.byteLength;
                for (var i = 0; i < hashLength; i++) {
                    binary += String.fromCharCode(hash[i]);
                }
                return binary;
            })
                .then(OAuth2AuthCodePKCE.base64urlEncode)
                .then(function (codeChallenge) { return ({ codeChallenge: codeChallenge, codeVerifier: codeVerifier }); });
        };
        /**
         * Generates random state to be passed for anti-csrf.
         */
        OAuth2AuthCodePKCE.generateRandomState = function (lengthOfState) {
            var output = new Uint32Array(lengthOfState);
            crypto.getRandomValues(output);
            return Array
                .from(output)
                .map(function (num) { return PKCE_CHARSET[num % PKCE_CHARSET.length]; })
                .join('');
        };
        return OAuth2AuthCodePKCE;
    }());
    exports.OAuth2AuthCodePKCE = OAuth2AuthCodePKCE;
    }(oauth2AuthCodePkce));

    // ND-JSON response streamer
    // See https://lichess.org/api#section/Introduction/Streaming-with-ND-JSON
    const readStream = (name, response, handler) => {
        const stream = response.body.getReader();
        const matcher = /\r?\n/;
        const decoder = new TextDecoder();
        let buf = '';
        const process = (json) => {
            const msg = JSON.parse(json);
            console.log(name, msg);
            handler(msg);
        };
        const loop = () => stream.read().then(({ done, value }) => {
            if (done) {
                if (buf.length > 0)
                    process(buf);
                return;
            }
            else {
                const chunk = decoder.decode(value, {
                    stream: true,
                });
                buf += chunk;
                const parts = buf.split(matcher);
                buf = parts.pop() || '';
                for (const i of parts.filter(p => p))
                    process(i);
                return loop();
            }
        });
        return {
            closePromise: loop(),
            close: () => stream.cancel(),
        };
    };

    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */
      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;

        /*
           When the port is the default http port 80 for http, or 443 for
           https, internet explorer 11 returns an empty string for loc.port,
           so we need to compare loc.port with an empty string if url.port
           is the default port 80 or 443.
           Also the comparition with `port` is changed from `===` to `==` because
           `port` can be a string sometimes. This only applies to ie11.
        */
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          (loc.port === url.port || loc.port === '' && (url.port == 80 || url.port == 443)); // jshint ignore:line
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || _page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) {
            ctx.routePath = self.path;
            return fn(ctx, next);
          }
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        delete params[0];

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    function routing (ctrl) {
        page_js.base(BASE_PATH);
        page_js('/', async (ctx) => {
            if (ctx.querystring.includes('code=liu_'))
                history.pushState({}, '', BASE_PATH || '/');
            ctrl.openHome();
        });
        page_js('/login', async (_) => {
            if (ctrl.auth.me)
                return page_js('/');
            await ctrl.auth.login();
        });
        page_js('/logout', async (_) => {
            await ctrl.auth.logout();
            location.href = BASE_PATH;
        });
        page_js('/game/:id', ctx => {
            ctrl.openGame(ctx.params.id);
        });
        page_js('/tv', ctx => ctrl.watchTv());
        page_js({ hashbang: true });
    }
    const BASE_PATH = location.pathname.replace(/\/$/, '');
    const url = (path) => `${BASE_PATH}${path}`;
    const href = (path) => ({ href: url(path) });

    const lichessHost = 'https://lichess.org';
    // export const lichessHost = 'http://l.org';
    const scopes = ['board:play'];
    const clientId = 'lichess-api-demo';
    const clientUrl = `${location.protocol}//${location.host}${BASE_PATH || '/'}`;
    class Auth {
        constructor() {
            this.oauth = new oauth2AuthCodePkce.OAuth2AuthCodePKCE({
                authorizationUrl: `${lichessHost}/oauth`,
                tokenUrl: `${lichessHost}/api/token`,
                clientId,
                scopes,
                redirectUrl: clientUrl,
                onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
                onInvalidGrant: console.warn,
            });
            this.authenticate = async () => {
                const httpClient = this.oauth.decorateFetchHTTPClient(window.fetch);
                const res = await httpClient(`${lichessHost}/api/account`);
                const me = Object.assign(Object.assign({}, (await res.json())), { httpClient });
                if (me.error)
                    throw me.error;
                this.me = me;
            };
            this.openStream = async (path, config, handler) => {
                const stream = await this.fetchResponse(path, config);
                return readStream(`STREAM ${path}`, stream, handler);
            };
            this.fetchBody = async (path, config = {}) => {
                const res = await this.fetchResponse(path, config);
                const body = await res.json();
                return body;
            };
            this.fetchResponse = async (path, config = {}) => {
                var _a;
                const res = await (((_a = this.me) === null || _a === void 0 ? void 0 : _a.httpClient) || window.fetch)(`${lichessHost}${path}`, config);
                if (res.error || !res.ok) {
                    const err = `${res.error} ${res.status} ${res.statusText}`;
                    alert(err);
                    throw err;
                }
                return res;
            };
        }
        async init() {
            try {
                const accessContext = await this.oauth.getAccessToken();
                if (accessContext)
                    await this.authenticate();
            }
            catch (err) {
                console.error(err);
            }
            if (!this.me) {
                try {
                    const hasAuthCode = await this.oauth.isReturningFromAuthServer();
                    if (hasAuthCode)
                        await this.authenticate();
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
        async login() {
            await this.oauth.fetchAuthorizationCode();
        }
        async logout() {
            if (this.me)
                await this.me.httpClient(`${lichessHost}/api/token`, { method: 'DELETE' });
            localStorage.clear();
            this.me = undefined;
        }
    }

    const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const COLORS = ['white', 'black'];
    const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
    const CASTLING_SIDES = ['a', 'h'];
    function isDrop(v) {
        return 'role' in v;
    }

    function defined(v) {
        return v !== undefined;
    }
    function opposite$1(color) {
        return color === 'white' ? 'black' : 'white';
    }
    function squareRank(square) {
        return square >> 3;
    }
    function squareFile(square) {
        return square & 0x7;
    }
    function roleToChar(role) {
        switch (role) {
            case 'pawn':
                return 'p';
            case 'knight':
                return 'n';
            case 'bishop':
                return 'b';
            case 'rook':
                return 'r';
            case 'queen':
                return 'q';
            case 'king':
                return 'k';
        }
    }
    function charToRole(ch) {
        switch (ch) {
            case 'P':
            case 'p':
                return 'pawn';
            case 'N':
            case 'n':
                return 'knight';
            case 'B':
            case 'b':
                return 'bishop';
            case 'R':
            case 'r':
                return 'rook';
            case 'Q':
            case 'q':
                return 'queen';
            case 'K':
            case 'k':
                return 'king';
            default:
                return;
        }
    }
    function parseSquare(str) {
        if (str.length !== 2)
            return;
        const file = str.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = str.charCodeAt(1) - '1'.charCodeAt(0);
        if (file < 0 || file >= 8 || rank < 0 || rank >= 8)
            return;
        return file + 8 * rank;
    }
    function makeSquare(square) {
        return (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]);
    }
    function parseUci(str) {
        if (str[1] === '@' && str.length === 4) {
            const role = charToRole(str[0]);
            const to = parseSquare(str.slice(2));
            if (role && defined(to))
                return { role, to };
        }
        else if (str.length === 4 || str.length === 5) {
            const from = parseSquare(str.slice(0, 2));
            const to = parseSquare(str.slice(2, 4));
            let promotion;
            if (str.length === 5) {
                promotion = charToRole(str[4]);
                if (!promotion)
                    return;
            }
            if (defined(from) && defined(to))
                return { from, to, promotion };
        }
        return;
    }
    function kingCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 2 : 6) : side === 'a' ? 58 : 62;
    }

    function popcnt32(n) {
        n = n - ((n >>> 1) & 1431655765);
        n = (n & 858993459) + ((n >>> 2) & 858993459);
        return Math.imul((n + (n >>> 4)) & 252645135, 16843009) >> 24;
    }
    function bswap32(n) {
        n = ((n >>> 8) & 16711935) | ((n & 16711935) << 8);
        return ((n >>> 16) & 0xffff) | ((n & 0xffff) << 16);
    }
    function rbit32(n) {
        n = ((n >>> 1) & 1431655765) | ((n & 1431655765) << 1);
        n = ((n >>> 2) & 858993459) | ((n & 858993459) << 2);
        n = ((n >>> 4) & 252645135) | ((n & 252645135) << 4);
        return bswap32(n);
    }
    class SquareSet {
        constructor(lo, hi) {
            this.lo = lo;
            this.hi = hi;
            this.lo = lo | 0;
            this.hi = hi | 0;
        }
        static fromSquare(square) {
            return square >= 32 ? new SquareSet(0, 1 << (square - 32)) : new SquareSet(1 << square, 0);
        }
        static fromRank(rank) {
            return new SquareSet(0xff, 0).shl64(8 * rank);
        }
        static fromFile(file) {
            return new SquareSet(16843009 << file, 16843009 << file);
        }
        static empty() {
            return new SquareSet(0, 0);
        }
        static full() {
            return new SquareSet(4294967295, 4294967295);
        }
        static corners() {
            return new SquareSet(0x81, 2164260864);
        }
        static center() {
            return new SquareSet(402653184, 0x18);
        }
        static backranks() {
            return new SquareSet(0xff, 4278190080);
        }
        static backrank(color) {
            return color === 'white' ? new SquareSet(0xff, 0) : new SquareSet(0, 4278190080);
        }
        static lightSquares() {
            return new SquareSet(1437226410, 1437226410);
        }
        static darkSquares() {
            return new SquareSet(2857740885, 2857740885);
        }
        complement() {
            return new SquareSet(~this.lo, ~this.hi);
        }
        xor(other) {
            return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
        }
        union(other) {
            return new SquareSet(this.lo | other.lo, this.hi | other.hi);
        }
        intersect(other) {
            return new SquareSet(this.lo & other.lo, this.hi & other.hi);
        }
        diff(other) {
            return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
        }
        intersects(other) {
            return this.intersect(other).nonEmpty();
        }
        isDisjoint(other) {
            return this.intersect(other).isEmpty();
        }
        supersetOf(other) {
            return other.diff(this).isEmpty();
        }
        subsetOf(other) {
            return this.diff(other).isEmpty();
        }
        shr64(shift) {
            if (shift >= 64)
                return SquareSet.empty();
            if (shift >= 32)
                return new SquareSet(this.hi >>> (shift - 32), 0);
            if (shift > 0)
                return new SquareSet((this.lo >>> shift) ^ (this.hi << (32 - shift)), this.hi >>> shift);
            return this;
        }
        shl64(shift) {
            if (shift >= 64)
                return SquareSet.empty();
            if (shift >= 32)
                return new SquareSet(0, this.lo << (shift - 32));
            if (shift > 0)
                return new SquareSet(this.lo << shift, (this.hi << shift) ^ (this.lo >>> (32 - shift)));
            return this;
        }
        bswap64() {
            return new SquareSet(bswap32(this.hi), bswap32(this.lo));
        }
        rbit64() {
            return new SquareSet(rbit32(this.hi), rbit32(this.lo));
        }
        minus64(other) {
            const lo = this.lo - other.lo;
            const c = ((lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1)) >>> 31;
            return new SquareSet(lo, this.hi - (other.hi + c));
        }
        equals(other) {
            return this.lo === other.lo && this.hi === other.hi;
        }
        size() {
            return popcnt32(this.lo) + popcnt32(this.hi);
        }
        isEmpty() {
            return this.lo === 0 && this.hi === 0;
        }
        nonEmpty() {
            return this.lo !== 0 || this.hi !== 0;
        }
        has(square) {
            return (square >= 32 ? this.hi & (1 << (square - 32)) : this.lo & (1 << square)) !== 0;
        }
        set(square, on) {
            return on ? this.with(square) : this.without(square);
        }
        with(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi | (1 << (square - 32)))
                : new SquareSet(this.lo | (1 << square), this.hi);
        }
        without(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi & ~(1 << (square - 32)))
                : new SquareSet(this.lo & ~(1 << square), this.hi);
        }
        toggle(square) {
            return square >= 32
                ? new SquareSet(this.lo, this.hi ^ (1 << (square - 32)))
                : new SquareSet(this.lo ^ (1 << square), this.hi);
        }
        last() {
            if (this.hi !== 0)
                return 63 - Math.clz32(this.hi);
            if (this.lo !== 0)
                return 31 - Math.clz32(this.lo);
            return;
        }
        first() {
            if (this.lo !== 0)
                return 31 - Math.clz32(this.lo & -this.lo);
            if (this.hi !== 0)
                return 63 - Math.clz32(this.hi & -this.hi);
            return;
        }
        withoutFirst() {
            if (this.lo !== 0)
                return new SquareSet(this.lo & (this.lo - 1), this.hi);
            return new SquareSet(0, this.hi & (this.hi - 1));
        }
        moreThanOne() {
            return (this.hi !== 0 && this.lo !== 0) || (this.lo & (this.lo - 1)) !== 0 || (this.hi & (this.hi - 1)) !== 0;
        }
        singleSquare() {
            return this.moreThanOne() ? undefined : this.last();
        }
        isSingleSquare() {
            return this.nonEmpty() && !this.moreThanOne();
        }
        *[Symbol.iterator]() {
            let lo = this.lo;
            let hi = this.hi;
            while (lo !== 0) {
                const idx = 31 - Math.clz32(lo & -lo);
                lo ^= 1 << idx;
                yield idx;
            }
            while (hi !== 0) {
                const idx = 31 - Math.clz32(hi & -hi);
                hi ^= 1 << idx;
                yield 32 + idx;
            }
        }
        *reversed() {
            let lo = this.lo;
            let hi = this.hi;
            while (hi !== 0) {
                const idx = 31 - Math.clz32(hi);
                hi ^= 1 << idx;
                yield 32 + idx;
            }
            while (lo !== 0) {
                const idx = 31 - Math.clz32(lo);
                lo ^= 1 << idx;
                yield idx;
            }
        }
    }

    /**
     * Compute attacks and rays.
     *
     * These are low-level functions that can be used to implement chess rules.
     *
     * Implementation notes: Sliding attacks are computed using
     * [hyperbola quintessence](https://www.chessprogramming.org/Hyperbola_Quintessence).
     * Magic bitboards would deliver faster lookups, but also require
     * initializing considerably larger attack tables. On the web, initialization
     * time is important, so the chosen method may strike a better balance.
     *
     * @packageDocumentation
     */
    function computeRange(square, deltas) {
        let range = SquareSet.empty();
        for (const delta of deltas) {
            const sq = square + delta;
            if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
                range = range.with(sq);
            }
        }
        return range;
    }
    function tabulate(f) {
        const table = [];
        for (let square = 0; square < 64; square++)
            table[square] = f(square);
        return table;
    }
    const KING_ATTACKS = tabulate(sq => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));
    const KNIGHT_ATTACKS = tabulate(sq => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));
    const PAWN_ATTACKS = {
        white: tabulate(sq => computeRange(sq, [7, 9])),
        black: tabulate(sq => computeRange(sq, [-7, -9])),
    };
    /**
     * Gets squares attacked or defended by a king on `square`.
     */
    function kingAttacks(square) {
        return KING_ATTACKS[square];
    }
    /**
     * Gets squares attacked or defended by a knight on `square`.
     */
    function knightAttacks(square) {
        return KNIGHT_ATTACKS[square];
    }
    /**
     * Gets squares attacked or defended by a pawn of the given `color`
     * on `square`.
     */
    function pawnAttacks(color, square) {
        return PAWN_ATTACKS[color][square];
    }
    const FILE_RANGE = tabulate(sq => SquareSet.fromFile(squareFile(sq)).without(sq));
    const RANK_RANGE = tabulate(sq => SquareSet.fromRank(squareRank(sq)).without(sq));
    const DIAG_RANGE = tabulate(sq => {
        const diag = new SquareSet(134480385, 2151686160);
        const shift = 8 * (squareRank(sq) - squareFile(sq));
        return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
    });
    const ANTI_DIAG_RANGE = tabulate(sq => {
        const diag = new SquareSet(270549120, 16909320);
        const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
        return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
    });
    function hyperbola(bit, range, occupied) {
        let forward = occupied.intersect(range);
        let reverse = forward.bswap64(); // Assumes no more than 1 bit per rank
        forward = forward.minus64(bit);
        reverse = reverse.minus64(bit.bswap64());
        return forward.xor(reverse.bswap64()).intersect(range);
    }
    function fileAttacks(square, occupied) {
        return hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
    }
    function rankAttacks(square, occupied) {
        const range = RANK_RANGE[square];
        let forward = occupied.intersect(range);
        let reverse = forward.rbit64();
        forward = forward.minus64(SquareSet.fromSquare(square));
        reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
        return forward.xor(reverse.rbit64()).intersect(range);
    }
    /**
     * Gets squares attacked or defended by a bishop on `square`, given `occupied`
     * squares.
     */
    function bishopAttacks(square, occupied) {
        const bit = SquareSet.fromSquare(square);
        return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
    }
    /**
     * Gets squares attacked or defended by a rook on `square`, given `occupied`
     * squares.
     */
    function rookAttacks(square, occupied) {
        return fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
    }
    /**
     * Gets squares attacked or defended by a queen on `square`, given `occupied`
     * squares.
     */
    function queenAttacks(square, occupied) {
        return bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
    }
    /**
     * Gets squares attacked or defended by a `piece` on `square`, given
     * `occupied` squares.
     */
    function attacks(piece, square, occupied) {
        switch (piece.role) {
            case 'pawn':
                return pawnAttacks(piece.color, square);
            case 'knight':
                return knightAttacks(square);
            case 'bishop':
                return bishopAttacks(square, occupied);
            case 'rook':
                return rookAttacks(square, occupied);
            case 'queen':
                return queenAttacks(square, occupied);
            case 'king':
                return kingAttacks(square);
        }
    }
    /**
     * Gets all squares of the rank, file or diagonal with the two squares
     * `a` and `b`, or an empty set if they are not aligned.
     */
    function ray(a, b) {
        const other = SquareSet.fromSquare(b);
        if (RANK_RANGE[a].intersects(other))
            return RANK_RANGE[a].with(a);
        if (ANTI_DIAG_RANGE[a].intersects(other))
            return ANTI_DIAG_RANGE[a].with(a);
        if (DIAG_RANGE[a].intersects(other))
            return DIAG_RANGE[a].with(a);
        if (FILE_RANGE[a].intersects(other))
            return FILE_RANGE[a].with(a);
        return SquareSet.empty();
    }
    /**
     * Gets all squares between `a` and `b` (bounds not included), or an empty set
     * if they are not on the same rank, file or diagonal.
     */
    function between(a, b) {
        return ray(a, b)
            .intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b)))
            .withoutFirst();
    }

    /**
     * Piece positions on a board.
     *
     * Properties are sets of squares, like `board.occupied` for all occupied
     * squares, `board[color]` for all pieces of that color, and `board[role]`
     * for all pieces of that role. When modifying the properties directly, take
     * care to keep them consistent.
     */
    class Board {
        constructor() { }
        static default() {
            const board = new Board();
            board.reset();
            return board;
        }
        static racingKings() {
            const board = new Board();
            board.occupied = new SquareSet(0xffff, 0);
            board.promoted = SquareSet.empty();
            board.white = new SquareSet(0xf0f0, 0);
            board.black = new SquareSet(0x0f0f, 0);
            board.pawn = SquareSet.empty();
            board.knight = new SquareSet(0x1818, 0);
            board.bishop = new SquareSet(0x2424, 0);
            board.rook = new SquareSet(0x4242, 0);
            board.queen = new SquareSet(0x0081, 0);
            board.king = new SquareSet(0x8100, 0);
            return board;
        }
        static horde() {
            const board = new Board();
            board.occupied = new SquareSet(4294967295, 4294901862);
            board.promoted = SquareSet.empty();
            board.white = new SquareSet(4294967295, 102);
            board.black = new SquareSet(0, 4294901760);
            board.pawn = new SquareSet(4294967295, 16711782);
            board.knight = new SquareSet(0, 1107296256);
            board.bishop = new SquareSet(0, 603979776);
            board.rook = new SquareSet(0, 2164260864);
            board.queen = new SquareSet(0, 134217728);
            board.king = new SquareSet(0, 268435456);
            return board;
        }
        /**
         * Resets all pieces to the default starting position for standard chess.
         */
        reset() {
            this.occupied = new SquareSet(0xffff, 4294901760);
            this.promoted = SquareSet.empty();
            this.white = new SquareSet(0xffff, 0);
            this.black = new SquareSet(0, 4294901760);
            this.pawn = new SquareSet(0xff00, 16711680);
            this.knight = new SquareSet(0x42, 1107296256);
            this.bishop = new SquareSet(0x24, 603979776);
            this.rook = new SquareSet(0x81, 2164260864);
            this.queen = new SquareSet(0x8, 134217728);
            this.king = new SquareSet(0x10, 268435456);
        }
        static empty() {
            const board = new Board();
            board.clear();
            return board;
        }
        clear() {
            this.occupied = SquareSet.empty();
            this.promoted = SquareSet.empty();
            for (const color of COLORS)
                this[color] = SquareSet.empty();
            for (const role of ROLES)
                this[role] = SquareSet.empty();
        }
        clone() {
            const board = new Board();
            board.occupied = this.occupied;
            board.promoted = this.promoted;
            for (const color of COLORS)
                board[color] = this[color];
            for (const role of ROLES)
                board[role] = this[role];
            return board;
        }
        equalsIgnorePromoted(other) {
            if (!this.white.equals(other.white))
                return false;
            return ROLES.every(role => this[role].equals(other[role]));
        }
        equals(other) {
            return this.equalsIgnorePromoted(other) && this.promoted.equals(other.promoted);
        }
        getColor(square) {
            if (this.white.has(square))
                return 'white';
            if (this.black.has(square))
                return 'black';
            return;
        }
        getRole(square) {
            for (const role of ROLES) {
                if (this[role].has(square))
                    return role;
            }
            return;
        }
        get(square) {
            const color = this.getColor(square);
            if (!color)
                return;
            const role = this.getRole(square);
            const promoted = this.promoted.has(square);
            return { color, role, promoted };
        }
        /**
         * Removes and returns the piece from the given `square`, if any.
         */
        take(square) {
            const piece = this.get(square);
            if (piece) {
                this.occupied = this.occupied.without(square);
                this[piece.color] = this[piece.color].without(square);
                this[piece.role] = this[piece.role].without(square);
                if (piece.promoted)
                    this.promoted = this.promoted.without(square);
            }
            return piece;
        }
        /**
         * Put `piece` onto `square`, potentially replacing an existing piece.
         * Returns the existing piece, if any.
         */
        set(square, piece) {
            const old = this.take(square);
            this.occupied = this.occupied.with(square);
            this[piece.color] = this[piece.color].with(square);
            this[piece.role] = this[piece.role].with(square);
            if (piece.promoted)
                this.promoted = this.promoted.with(square);
            return old;
        }
        has(square) {
            return this.occupied.has(square);
        }
        *[Symbol.iterator]() {
            for (const square of this.occupied) {
                yield [square, this.get(square)];
            }
        }
        pieces(color, role) {
            return this[color].intersect(this[role]);
        }
        rooksAndQueens() {
            return this.rook.union(this.queen);
        }
        bishopsAndQueens() {
            return this.bishop.union(this.queen);
        }
        /**
         * Finds the unique unpromoted king of the given `color`, if any.
         */
        kingOf(color) {
            return this.king.intersect(this[color]).diff(this.promoted).singleSquare();
        }
    }

    class MaterialSide {
        constructor() { }
        static empty() {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = 0;
            return m;
        }
        static fromBoard(board, color) {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = board.pieces(color, role).size();
            return m;
        }
        clone() {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = this[role];
            return m;
        }
        equals(other) {
            return ROLES.every(role => this[role] === other[role]);
        }
        add(other) {
            const m = new MaterialSide();
            for (const role of ROLES)
                m[role] = this[role] + other[role];
            return m;
        }
        nonEmpty() {
            return ROLES.some(role => this[role] > 0);
        }
        isEmpty() {
            return !this.nonEmpty();
        }
        hasPawns() {
            return this.pawn > 0;
        }
        hasNonPawns() {
            return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
        }
        count() {
            return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
        }
    }
    class Material {
        constructor(white, black) {
            this.white = white;
            this.black = black;
        }
        static empty() {
            return new Material(MaterialSide.empty(), MaterialSide.empty());
        }
        static fromBoard(board) {
            return new Material(MaterialSide.fromBoard(board, 'white'), MaterialSide.fromBoard(board, 'black'));
        }
        clone() {
            return new Material(this.white.clone(), this.black.clone());
        }
        equals(other) {
            return this.white.equals(other.white) && this.black.equals(other.black);
        }
        add(other) {
            return new Material(this.white.add(other.white), this.black.add(other.black));
        }
        count() {
            return this.white.count() + this.black.count();
        }
        isEmpty() {
            return this.white.isEmpty() && this.black.isEmpty();
        }
        nonEmpty() {
            return !this.isEmpty();
        }
        hasPawns() {
            return this.white.hasPawns() || this.black.hasPawns();
        }
        hasNonPawns() {
            return this.white.hasNonPawns() || this.black.hasNonPawns();
        }
    }
    class RemainingChecks {
        constructor(white, black) {
            this.white = white;
            this.black = black;
        }
        static default() {
            return new RemainingChecks(3, 3);
        }
        clone() {
            return new RemainingChecks(this.white, this.black);
        }
        equals(other) {
            return this.white === other.white && this.black === other.black;
        }
    }
    function defaultSetup() {
        return {
            board: Board.default(),
            pockets: undefined,
            turn: 'white',
            unmovedRooks: SquareSet.corners(),
            epSquare: undefined,
            remainingChecks: undefined,
            halfmoves: 0,
            fullmoves: 1,
        };
    }

    function r(r,n){r.prototype=Object.create(n.prototype),r.prototype.constructor=r,r.__proto__=n;}var n,t=function(){function r(){}var t=r.prototype;return t.unwrap=function(r,t){var o=this._chain(function(t){return n.ok(r?r(t):t)},function(r){return t?n.ok(t(r)):n.err(r)});if(o.isErr)throw o.error;return o.value},t.map=function(r,t){return this._chain(function(t){return n.ok(r(t))},function(r){return n.err(t?t(r):r)})},t.chain=function(r,t){return this._chain(r,t||function(r){return n.err(r)})},r}(),o=function(n){function t(r){var t;return (t=n.call(this)||this).value=r,t.isOk=!0,t.isErr=!1,t}return r(t,n),t.prototype._chain=function(r,n){return r(this.value)},t}(t),e=function(n){function t(r){var t;return (t=n.call(this)||this).error=r,t.isOk=!1,t.isErr=!0,t}return r(t,n),t.prototype._chain=function(r,n){return n(this.error)},t}(t);!function(r){r.ok=function(r){return new o(r)},r.err=function(r){return new e(r||new Error)},r.all=function(n){if(Array.isArray(n)){for(var t=[],o=0;o<n.length;o++){var e=n[o];if(e.isErr)return e;t.push(e.value);}return r.ok(t)}for(var u={},i=Object.keys(n),c=0;c<i.length;c++){var a=n[i[c]];if(a.isErr)return a;u[i[c]]=a.value;}return r.ok(u)};}(n||(n={}));

    var IllegalSetup;
    (function (IllegalSetup) {
        IllegalSetup["Empty"] = "ERR_EMPTY";
        IllegalSetup["OppositeCheck"] = "ERR_OPPOSITE_CHECK";
        IllegalSetup["ImpossibleCheck"] = "ERR_IMPOSSIBLE_CHECK";
        IllegalSetup["PawnsOnBackrank"] = "ERR_PAWNS_ON_BACKRANK";
        IllegalSetup["Kings"] = "ERR_KINGS";
        IllegalSetup["Variant"] = "ERR_VARIANT";
    })(IllegalSetup || (IllegalSetup = {}));
    class PositionError extends Error {
    }
    function attacksTo(square, attacker, board, occupied) {
        return board[attacker].intersect(rookAttacks(square, occupied)
            .intersect(board.rooksAndQueens())
            .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
            .union(knightAttacks(square).intersect(board.knight))
            .union(kingAttacks(square).intersect(board.king))
            .union(pawnAttacks(opposite$1(attacker), square).intersect(board.pawn)));
    }
    function rookCastlesTo(color, side) {
        return color === 'white' ? (side === 'a' ? 3 : 5) : side === 'a' ? 59 : 61;
    }
    class Castles {
        constructor() { }
        static default() {
            const castles = new Castles();
            castles.unmovedRooks = SquareSet.corners();
            castles.rook = {
                white: { a: 0, h: 7 },
                black: { a: 56, h: 63 },
            };
            castles.path = {
                white: { a: new SquareSet(0xe, 0), h: new SquareSet(0x60, 0) },
                black: { a: new SquareSet(0, 0x0e000000), h: new SquareSet(0, 0x60000000) },
            };
            return castles;
        }
        static empty() {
            const castles = new Castles();
            castles.unmovedRooks = SquareSet.empty();
            castles.rook = {
                white: { a: undefined, h: undefined },
                black: { a: undefined, h: undefined },
            };
            castles.path = {
                white: { a: SquareSet.empty(), h: SquareSet.empty() },
                black: { a: SquareSet.empty(), h: SquareSet.empty() },
            };
            return castles;
        }
        clone() {
            const castles = new Castles();
            castles.unmovedRooks = this.unmovedRooks;
            castles.rook = {
                white: { a: this.rook.white.a, h: this.rook.white.h },
                black: { a: this.rook.black.a, h: this.rook.black.h },
            };
            castles.path = {
                white: { a: this.path.white.a, h: this.path.white.h },
                black: { a: this.path.black.a, h: this.path.black.h },
            };
            return castles;
        }
        add(color, side, king, rook) {
            const kingTo = kingCastlesTo(color, side);
            const rookTo = rookCastlesTo(color, side);
            this.unmovedRooks = this.unmovedRooks.with(rook);
            this.rook[color][side] = rook;
            this.path[color][side] = between(rook, rookTo)
                .with(rookTo)
                .union(between(king, kingTo).with(kingTo))
                .without(king)
                .without(rook);
        }
        static fromSetup(setup) {
            const castles = Castles.empty();
            const rooks = setup.unmovedRooks.intersect(setup.board.rook);
            for (const color of COLORS) {
                const backrank = SquareSet.backrank(color);
                const king = setup.board.kingOf(color);
                if (!defined(king) || !backrank.has(king))
                    continue;
                const side = rooks.intersect(setup.board[color]).intersect(backrank);
                const aSide = side.first();
                if (defined(aSide) && aSide < king)
                    castles.add(color, 'a', king, aSide);
                const hSide = side.last();
                if (defined(hSide) && king < hSide)
                    castles.add(color, 'h', king, hSide);
            }
            return castles;
        }
        discardRook(square) {
            if (this.unmovedRooks.has(square)) {
                this.unmovedRooks = this.unmovedRooks.without(square);
                for (const color of COLORS) {
                    for (const side of CASTLING_SIDES) {
                        if (this.rook[color][side] === square)
                            this.rook[color][side] = undefined;
                    }
                }
            }
        }
        discardSide(color) {
            this.unmovedRooks = this.unmovedRooks.diff(SquareSet.backrank(color));
            this.rook[color].a = undefined;
            this.rook[color].h = undefined;
        }
    }
    class Position {
        constructor(rules) {
            this.rules = rules;
        }
        kingAttackers(square, attacker, occupied) {
            return attacksTo(square, attacker, this.board, occupied);
        }
        dropDests(_ctx) {
            return SquareSet.empty();
        }
        playCaptureAt(square, captured) {
            this.halfmoves = 0;
            if (captured.role === 'rook')
                this.castles.discardRook(square);
            if (this.pockets)
                this.pockets[opposite$1(captured.color)][captured.role]++;
        }
        ctx() {
            const variantEnd = this.isVariantEnd();
            const king = this.board.kingOf(this.turn);
            if (!defined(king))
                return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
            const snipers = rookAttacks(king, SquareSet.empty())
                .intersect(this.board.rooksAndQueens())
                .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
                .intersect(this.board[opposite$1(this.turn)]);
            let blockers = SquareSet.empty();
            for (const sniper of snipers) {
                const b = between(king, sniper).intersect(this.board.occupied);
                if (!b.moreThanOne())
                    blockers = blockers.union(b);
            }
            const checkers = this.kingAttackers(king, opposite$1(this.turn), this.board.occupied);
            return {
                king,
                blockers,
                checkers,
                variantEnd,
                mustCapture: false,
            };
        }
        // The following should be identical in all subclasses
        clone() {
            var _a, _b;
            const pos = new this.constructor();
            pos.board = this.board.clone();
            pos.pockets = (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone();
            pos.turn = this.turn;
            pos.castles = this.castles.clone();
            pos.epSquare = this.epSquare;
            pos.remainingChecks = (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone();
            pos.halfmoves = this.halfmoves;
            pos.fullmoves = this.fullmoves;
            return pos;
        }
        equalsIgnoreMoves(other) {
            var _a, _b;
            return (this.rules === other.rules &&
                (this.pockets ? this.board.equals(other.board) : this.board.equalsIgnorePromoted(other.board)) &&
                ((other.pockets && ((_a = this.pockets) === null || _a === void 0 ? void 0 : _a.equals(other.pockets))) || (!this.pockets && !other.pockets)) &&
                this.turn === other.turn &&
                this.castles.unmovedRooks.equals(other.castles.unmovedRooks) &&
                this.legalEpSquare() === other.legalEpSquare() &&
                ((other.remainingChecks && ((_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.equals(other.remainingChecks))) ||
                    (!this.remainingChecks && !other.remainingChecks)));
        }
        toSetup() {
            var _a, _b;
            return {
                board: this.board.clone(),
                pockets: (_a = this.pockets) === null || _a === void 0 ? void 0 : _a.clone(),
                turn: this.turn,
                unmovedRooks: this.castles.unmovedRooks,
                epSquare: this.legalEpSquare(),
                remainingChecks: (_b = this.remainingChecks) === null || _b === void 0 ? void 0 : _b.clone(),
                halfmoves: Math.min(this.halfmoves, 150),
                fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999),
            };
        }
        isInsufficientMaterial() {
            return COLORS.every(color => this.hasInsufficientMaterial(color));
        }
        hasDests(ctx) {
            ctx = ctx || this.ctx();
            for (const square of this.board[this.turn]) {
                if (this.dests(square, ctx).nonEmpty())
                    return true;
            }
            return this.dropDests(ctx).nonEmpty();
        }
        isLegal(move, ctx) {
            if (isDrop(move)) {
                if (!this.pockets || this.pockets[this.turn][move.role] <= 0)
                    return false;
                if (move.role === 'pawn' && SquareSet.backranks().has(move.to))
                    return false;
                return this.dropDests(ctx).has(move.to);
            }
            else {
                if (move.promotion === 'pawn')
                    return false;
                if (move.promotion === 'king' && this.rules !== 'antichess')
                    return false;
                if (!!move.promotion !== (this.board.pawn.has(move.from) && SquareSet.backranks().has(move.to)))
                    return false;
                const dests = this.dests(move.from, ctx);
                return dests.has(move.to) || dests.has(this.normalizeMove(move).to);
            }
        }
        isCheck() {
            const king = this.board.kingOf(this.turn);
            return defined(king) && this.kingAttackers(king, opposite$1(this.turn), this.board.occupied).nonEmpty();
        }
        isEnd(ctx) {
            if (ctx ? ctx.variantEnd : this.isVariantEnd())
                return true;
            return this.isInsufficientMaterial() || !this.hasDests(ctx);
        }
        isCheckmate(ctx) {
            ctx = ctx || this.ctx();
            return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
        }
        isStalemate(ctx) {
            ctx = ctx || this.ctx();
            return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
        }
        outcome(ctx) {
            const variantOutcome = this.variantOutcome(ctx);
            if (variantOutcome)
                return variantOutcome;
            ctx = ctx || this.ctx();
            if (this.isCheckmate(ctx))
                return { winner: opposite$1(this.turn) };
            else if (this.isInsufficientMaterial() || this.isStalemate(ctx))
                return { winner: undefined };
            else
                return;
        }
        allDests(ctx) {
            ctx = ctx || this.ctx();
            const d = new Map();
            if (ctx.variantEnd)
                return d;
            for (const square of this.board[this.turn]) {
                d.set(square, this.dests(square, ctx));
            }
            return d;
        }
        castlingSide(move) {
            if (isDrop(move))
                return;
            const delta = move.to - move.from;
            if (Math.abs(delta) !== 2 && !this.board[this.turn].has(move.to))
                return;
            if (!this.board.king.has(move.from))
                return;
            return delta > 0 ? 'h' : 'a';
        }
        normalizeMove(move) {
            const castlingSide = this.castlingSide(move);
            if (!castlingSide)
                return move;
            const rookFrom = this.castles.rook[this.turn][castlingSide];
            return {
                from: move.from,
                to: defined(rookFrom) ? rookFrom : move.to,
            };
        }
        play(move) {
            const turn = this.turn;
            const epSquare = this.epSquare;
            const castlingSide = this.castlingSide(move);
            this.epSquare = undefined;
            this.halfmoves += 1;
            if (turn === 'black')
                this.fullmoves += 1;
            this.turn = opposite$1(turn);
            if (isDrop(move)) {
                this.board.set(move.to, { role: move.role, color: turn });
                if (this.pockets)
                    this.pockets[turn][move.role]--;
                if (move.role === 'pawn')
                    this.halfmoves = 0;
            }
            else {
                const piece = this.board.take(move.from);
                if (!piece)
                    return;
                let epCapture;
                if (piece.role === 'pawn') {
                    this.halfmoves = 0;
                    if (move.to === epSquare) {
                        epCapture = this.board.take(move.to + (turn === 'white' ? -8 : 8));
                    }
                    const delta = move.from - move.to;
                    if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
                        this.epSquare = (move.from + move.to) >> 1;
                    }
                    if (move.promotion) {
                        piece.role = move.promotion;
                        piece.promoted = true;
                    }
                }
                else if (piece.role === 'rook') {
                    this.castles.discardRook(move.from);
                }
                else if (piece.role === 'king') {
                    if (castlingSide) {
                        const rookFrom = this.castles.rook[turn][castlingSide];
                        if (defined(rookFrom)) {
                            const rook = this.board.take(rookFrom);
                            this.board.set(kingCastlesTo(turn, castlingSide), piece);
                            if (rook)
                                this.board.set(rookCastlesTo(turn, castlingSide), rook);
                        }
                    }
                    this.castles.discardSide(turn);
                }
                if (!castlingSide) {
                    const capture = this.board.set(move.to, piece) || epCapture;
                    if (capture)
                        this.playCaptureAt(move.to, capture);
                }
            }
            if (this.remainingChecks) {
                if (this.isCheck())
                    this.remainingChecks[turn] = Math.max(this.remainingChecks[turn] - 1, 0);
            }
        }
        legalEpSquare(ctx) {
            if (!defined(this.epSquare))
                return;
            ctx = ctx || this.ctx();
            const ourPawns = this.board.pieces(this.turn, 'pawn');
            const candidates = ourPawns.intersect(pawnAttacks(opposite$1(this.turn), this.epSquare));
            for (const candidate of candidates) {
                if (this.dests(candidate, ctx).has(this.epSquare))
                    return this.epSquare;
            }
            return;
        }
    }
    class Chess extends Position {
        constructor(rules) {
            super(rules || 'chess');
        }
        static default() {
            const pos = new this();
            pos.board = Board.default();
            pos.pockets = undefined;
            pos.turn = 'white';
            pos.castles = Castles.default();
            pos.epSquare = undefined;
            pos.remainingChecks = undefined;
            pos.halfmoves = 0;
            pos.fullmoves = 1;
            return pos;
        }
        static fromSetup(setup, opts) {
            const pos = new this();
            pos.board = setup.board.clone();
            pos.pockets = undefined;
            pos.turn = setup.turn;
            pos.castles = Castles.fromSetup(setup);
            pos.epSquare = pos.validEpSquare(setup.epSquare);
            pos.remainingChecks = undefined;
            pos.halfmoves = setup.halfmoves;
            pos.fullmoves = setup.fullmoves;
            return pos.validate(opts).map(_ => pos);
        }
        clone() {
            return super.clone();
        }
        validate(opts) {
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (this.board.king.size() !== 2)
                return n.err(new PositionError(IllegalSetup.Kings));
            if (!defined(this.board.kingOf(this.turn)))
                return n.err(new PositionError(IllegalSetup.Kings));
            const otherKing = this.board.kingOf(opposite$1(this.turn));
            if (!defined(otherKing))
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            if (SquareSet.backranks().intersects(this.board.pawn))
                return n.err(new PositionError(IllegalSetup.PawnsOnBackrank));
            return (opts === null || opts === void 0 ? void 0 : opts.ignoreImpossibleCheck) ? n.ok(undefined) : this.validateCheckers();
        }
        validateCheckers() {
            const ourKing = this.board.kingOf(this.turn);
            if (defined(ourKing)) {
                const checkers = this.kingAttackers(ourKing, opposite$1(this.turn), this.board.occupied);
                if (checkers.nonEmpty()) {
                    if (defined(this.epSquare)) {
                        // The pushed pawn must be the only checker, or it has uncovered
                        // check by a single sliding piece.
                        const pushedTo = this.epSquare ^ 8;
                        const pushedFrom = this.epSquare ^ 24;
                        if (checkers.moreThanOne() ||
                            (checkers.first() != pushedTo &&
                                this.kingAttackers(ourKing, opposite$1(this.turn), this.board.occupied.without(pushedTo).with(pushedFrom)).nonEmpty()))
                            return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                    }
                    else {
                        // Multiple sliding checkers aligned with king.
                        if (checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first(), checkers.last()).has(ourKing)))
                            return n.err(new PositionError(IllegalSetup.ImpossibleCheck));
                    }
                }
            }
            return n.ok(undefined);
        }
        validEpSquare(square) {
            if (!defined(square))
                return;
            const epRank = this.turn === 'white' ? 5 : 2;
            const forward = this.turn === 'white' ? 8 : -8;
            if (squareRank(square) !== epRank)
                return;
            if (this.board.occupied.has(square + forward))
                return;
            const pawn = square - forward;
            if (!this.board.pawn.has(pawn) || !this.board[opposite$1(this.turn)].has(pawn))
                return;
            return square;
        }
        castlingDest(side, ctx) {
            if (!defined(ctx.king) || ctx.checkers.nonEmpty())
                return SquareSet.empty();
            const rook = this.castles.rook[this.turn][side];
            if (!defined(rook))
                return SquareSet.empty();
            if (this.castles.path[this.turn][side].intersects(this.board.occupied))
                return SquareSet.empty();
            const kingTo = kingCastlesTo(this.turn, side);
            const kingPath = between(ctx.king, kingTo);
            const occ = this.board.occupied.without(ctx.king);
            for (const sq of kingPath) {
                if (this.kingAttackers(sq, opposite$1(this.turn), occ).nonEmpty())
                    return SquareSet.empty();
            }
            const rookTo = rookCastlesTo(this.turn, side);
            const after = this.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
            if (this.kingAttackers(kingTo, opposite$1(this.turn), after).nonEmpty())
                return SquareSet.empty();
            return SquareSet.fromSquare(rook);
        }
        canCaptureEp(pawn, ctx) {
            if (!defined(this.epSquare))
                return false;
            if (!pawnAttacks(this.turn, pawn).has(this.epSquare))
                return false;
            if (!defined(ctx.king))
                return true;
            const captured = this.epSquare + (this.turn === 'white' ? -8 : 8);
            const occupied = this.board.occupied.toggle(pawn).toggle(this.epSquare).toggle(captured);
            return !this.kingAttackers(ctx.king, opposite$1(this.turn), occupied).intersects(occupied);
        }
        pseudoDests(square, ctx) {
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo = attacks(piece, square, this.board.occupied);
            if (piece.role === 'pawn') {
                let captureTargets = this.board[opposite$1(this.turn)];
                if (defined(this.epSquare))
                    captureTargets = captureTargets.with(this.epSquare);
                pseudo = pseudo.intersect(captureTargets);
                const delta = this.turn === 'white' ? 8 : -8;
                const step = square + delta;
                if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
                    pseudo = pseudo.with(step);
                    const canDoubleStep = this.turn === 'white' ? square < 16 : square >= 64 - 16;
                    const doubleStep = step + delta;
                    if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
                        pseudo = pseudo.with(doubleStep);
                    }
                }
                return pseudo;
            }
            else {
                pseudo = pseudo.diff(this.board[this.turn]);
            }
            if (square === ctx.king)
                return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
            else
                return pseudo;
        }
        dests(square, ctx) {
            ctx = ctx || this.ctx();
            if (ctx.variantEnd)
                return SquareSet.empty();
            const piece = this.board.get(square);
            if (!piece || piece.color !== this.turn)
                return SquareSet.empty();
            let pseudo, legal;
            if (piece.role === 'pawn') {
                pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite$1(this.turn)]);
                const delta = this.turn === 'white' ? 8 : -8;
                const step = square + delta;
                if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
                    pseudo = pseudo.with(step);
                    const canDoubleStep = this.turn === 'white' ? square < 16 : square >= 64 - 16;
                    const doubleStep = step + delta;
                    if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
                        pseudo = pseudo.with(doubleStep);
                    }
                }
                if (defined(this.epSquare) && this.canCaptureEp(square, ctx)) {
                    const pawn = this.epSquare - delta;
                    if (ctx.checkers.isEmpty() || ctx.checkers.singleSquare() === pawn) {
                        legal = SquareSet.fromSquare(this.epSquare);
                    }
                }
            }
            else if (piece.role === 'bishop')
                pseudo = bishopAttacks(square, this.board.occupied);
            else if (piece.role === 'knight')
                pseudo = knightAttacks(square);
            else if (piece.role === 'rook')
                pseudo = rookAttacks(square, this.board.occupied);
            else if (piece.role === 'queen')
                pseudo = queenAttacks(square, this.board.occupied);
            else
                pseudo = kingAttacks(square);
            pseudo = pseudo.diff(this.board[this.turn]);
            if (defined(ctx.king)) {
                if (piece.role === 'king') {
                    const occ = this.board.occupied.without(square);
                    for (const to of pseudo) {
                        if (this.kingAttackers(to, opposite$1(this.turn), occ).nonEmpty())
                            pseudo = pseudo.without(to);
                    }
                    return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
                }
                if (ctx.checkers.nonEmpty()) {
                    const checker = ctx.checkers.singleSquare();
                    if (!defined(checker))
                        return SquareSet.empty();
                    pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
                }
                if (ctx.blockers.has(square))
                    pseudo = pseudo.intersect(ray(square, ctx.king));
            }
            if (legal)
                pseudo = pseudo.union(legal);
            return pseudo;
        }
        isVariantEnd() {
            return false;
        }
        variantOutcome(_ctx) {
            return;
        }
        hasInsufficientMaterial(color) {
            if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty())
                return false;
            if (this.board[color].intersects(this.board.knight)) {
                return (this.board[color].size() <= 2 &&
                    this.board[opposite$1(color)].diff(this.board.king).diff(this.board.queen).isEmpty());
            }
            if (this.board[color].intersects(this.board.bishop)) {
                const sameColor = !this.board.bishop.intersects(SquareSet.darkSquares()) ||
                    !this.board.bishop.intersects(SquareSet.lightSquares());
                return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
            }
            return true;
        }
    }

    function chessgroundDests(pos, opts) {
        const result = new Map();
        const ctx = pos.ctx();
        for (const [from, squares] of pos.allDests(ctx)) {
            if (squares.nonEmpty()) {
                const d = Array.from(squares, makeSquare);
                if (!(opts === null || opts === void 0 ? void 0 : opts.chess960) && from === ctx.king && squareFile(from) === 4) {
                    // Chessground needs both types of castling dests and filters based on
                    // a rookCastles setting.
                    if (squares.has(0))
                        d.push('c1');
                    else if (squares.has(56))
                        d.push('c8');
                    if (squares.has(7))
                        d.push('g1');
                    else if (squares.has(63))
                        d.push('g8');
                }
                result.set(makeSquare(from), d);
            }
        }
        return result;
    }

    var InvalidFen;
    (function (InvalidFen) {
        InvalidFen["Fen"] = "ERR_FEN";
        InvalidFen["Board"] = "ERR_BOARD";
        InvalidFen["Pockets"] = "ERR_POCKETS";
        InvalidFen["Turn"] = "ERR_TURN";
        InvalidFen["Castling"] = "ERR_CASTLING";
        InvalidFen["EpSquare"] = "ERR_EP_SQUARE";
        InvalidFen["RemainingChecks"] = "ERR_REMAINING_CHECKS";
        InvalidFen["Halfmoves"] = "ERR_HALFMOVES";
        InvalidFen["Fullmoves"] = "ERR_FULLMOVES";
    })(InvalidFen || (InvalidFen = {}));
    class FenError extends Error {
    }
    function nthIndexOf(haystack, needle, n) {
        let index = haystack.indexOf(needle);
        while (n-- > 0) {
            if (index === -1)
                break;
            index = haystack.indexOf(needle, index + needle.length);
        }
        return index;
    }
    function parseSmallUint(str) {
        return /^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined;
    }
    function charToPiece(ch) {
        const role = charToRole(ch);
        return role && { role, color: ch.toLowerCase() === ch ? 'black' : 'white' };
    }
    function parseBoardFen(boardPart) {
        const board = Board.empty();
        let rank = 7;
        let file = 0;
        for (let i = 0; i < boardPart.length; i++) {
            const c = boardPart[i];
            if (c === '/' && file === 8) {
                file = 0;
                rank--;
            }
            else {
                const step = parseInt(c, 10);
                if (step > 0)
                    file += step;
                else {
                    if (file >= 8 || rank < 0)
                        return n.err(new FenError(InvalidFen.Board));
                    const square = file + rank * 8;
                    const piece = charToPiece(c);
                    if (!piece)
                        return n.err(new FenError(InvalidFen.Board));
                    if (boardPart[i + 1] === '~') {
                        piece.promoted = true;
                        i++;
                    }
                    board.set(square, piece);
                    file++;
                }
            }
        }
        if (rank !== 0 || file !== 8)
            return n.err(new FenError(InvalidFen.Board));
        return n.ok(board);
    }
    function parsePockets(pocketPart) {
        if (pocketPart.length > 64)
            return n.err(new FenError(InvalidFen.Pockets));
        const pockets = Material.empty();
        for (const c of pocketPart) {
            const piece = charToPiece(c);
            if (!piece)
                return n.err(new FenError(InvalidFen.Pockets));
            pockets[piece.color][piece.role]++;
        }
        return n.ok(pockets);
    }
    function parseCastlingFen(board, castlingPart) {
        let unmovedRooks = SquareSet.empty();
        if (castlingPart === '-')
            return n.ok(unmovedRooks);
        for (const c of castlingPart) {
            const lower = c.toLowerCase();
            const color = c === lower ? 'black' : 'white';
            const backrank = SquareSet.backrank(color).intersect(board[color]);
            let candidates;
            if (lower === 'q')
                candidates = backrank;
            else if (lower === 'k')
                candidates = backrank.reversed();
            else if ('a' <= lower && lower <= 'h')
                candidates = SquareSet.fromSquare(lower.charCodeAt(0) - 'a'.charCodeAt(0)).intersect(backrank);
            else
                return n.err(new FenError(InvalidFen.Castling));
            for (const square of candidates) {
                if (board.king.has(square) && !board.promoted.has(square))
                    break;
                if (board.rook.has(square)) {
                    unmovedRooks = unmovedRooks.with(square);
                    break;
                }
            }
        }
        if (COLORS.some(color => SquareSet.backrank(color).intersect(unmovedRooks).size() > 2))
            return n.err(new FenError(InvalidFen.Castling));
        return n.ok(unmovedRooks);
    }
    function parseRemainingChecks(part) {
        const parts = part.split('+');
        if (parts.length === 3 && parts[0] === '') {
            const white = parseSmallUint(parts[1]);
            const black = parseSmallUint(parts[2]);
            if (!defined(white) || white > 3 || !defined(black) || black > 3)
                return n.err(new FenError(InvalidFen.RemainingChecks));
            return n.ok(new RemainingChecks(3 - white, 3 - black));
        }
        else if (parts.length === 2) {
            const white = parseSmallUint(parts[0]);
            const black = parseSmallUint(parts[1]);
            if (!defined(white) || white > 3 || !defined(black) || black > 3)
                return n.err(new FenError(InvalidFen.RemainingChecks));
            return n.ok(new RemainingChecks(white, black));
        }
        else
            return n.err(new FenError(InvalidFen.RemainingChecks));
    }
    function parseFen(fen) {
        const parts = fen.split(/[\s_]+/);
        const boardPart = parts.shift();
        // Board and pockets
        let board, pockets = n.ok(undefined);
        if (boardPart.endsWith(']')) {
            const pocketStart = boardPart.indexOf('[');
            if (pocketStart === -1)
                return n.err(new FenError(InvalidFen.Fen));
            board = parseBoardFen(boardPart.substr(0, pocketStart));
            pockets = parsePockets(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
        }
        else {
            const pocketStart = nthIndexOf(boardPart, '/', 7);
            if (pocketStart === -1)
                board = parseBoardFen(boardPart);
            else {
                board = parseBoardFen(boardPart.substr(0, pocketStart));
                pockets = parsePockets(boardPart.substr(pocketStart + 1));
            }
        }
        // Turn
        let turn;
        const turnPart = parts.shift();
        if (!defined(turnPart) || turnPart === 'w')
            turn = 'white';
        else if (turnPart === 'b')
            turn = 'black';
        else
            return n.err(new FenError(InvalidFen.Turn));
        return board.chain(board => {
            // Castling
            const castlingPart = parts.shift();
            const unmovedRooks = defined(castlingPart) ? parseCastlingFen(board, castlingPart) : n.ok(SquareSet.empty());
            // En passant square
            const epPart = parts.shift();
            let epSquare;
            if (defined(epPart) && epPart !== '-') {
                epSquare = parseSquare(epPart);
                if (!defined(epSquare))
                    return n.err(new FenError(InvalidFen.EpSquare));
            }
            // Halfmoves or remaining checks
            let halfmovePart = parts.shift();
            let earlyRemainingChecks;
            if (defined(halfmovePart) && halfmovePart.includes('+')) {
                earlyRemainingChecks = parseRemainingChecks(halfmovePart);
                halfmovePart = parts.shift();
            }
            const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
            if (!defined(halfmoves))
                return n.err(new FenError(InvalidFen.Halfmoves));
            const fullmovesPart = parts.shift();
            const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
            if (!defined(fullmoves))
                return n.err(new FenError(InvalidFen.Fullmoves));
            const remainingChecksPart = parts.shift();
            let remainingChecks = n.ok(undefined);
            if (defined(remainingChecksPart)) {
                if (defined(earlyRemainingChecks))
                    return n.err(new FenError(InvalidFen.RemainingChecks));
                remainingChecks = parseRemainingChecks(remainingChecksPart);
            }
            else if (defined(earlyRemainingChecks)) {
                remainingChecks = earlyRemainingChecks;
            }
            if (parts.length > 0)
                return n.err(new FenError(InvalidFen.Fen));
            return pockets.chain(pockets => unmovedRooks.chain(unmovedRooks => remainingChecks.map(remainingChecks => {
                return {
                    board,
                    pockets,
                    turn,
                    unmovedRooks,
                    remainingChecks,
                    epSquare,
                    halfmoves,
                    fullmoves: Math.max(1, fullmoves),
                };
            })));
        });
    }
    function makePiece$1(piece, opts) {
        let r = roleToChar(piece.role);
        if (piece.color === 'white')
            r = r.toUpperCase();
        if ((opts === null || opts === void 0 ? void 0 : opts.promoted) && piece.promoted)
            r += '~';
        return r;
    }
    function makeBoardFen(board, opts) {
        let fen = '';
        let empty = 0;
        for (let rank = 7; rank >= 0; rank--) {
            for (let file = 0; file < 8; file++) {
                const square = file + rank * 8;
                const piece = board.get(square);
                if (!piece)
                    empty++;
                else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    fen += makePiece$1(piece, opts);
                }
                if (file === 7) {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    if (rank !== 0)
                        fen += '/';
                }
            }
        }
        return fen;
    }
    function makePocket(material) {
        return ROLES.map(role => roleToChar(role).repeat(material[role])).join('');
    }
    function makePockets(pocket) {
        return makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
    }
    function makeCastlingFen(board, unmovedRooks, opts) {
        const shredder = opts === null || opts === void 0 ? void 0 : opts.shredder;
        let fen = '';
        for (const color of COLORS) {
            const backrank = SquareSet.backrank(color);
            const king = board.kingOf(color);
            if (!defined(king) || !backrank.has(king))
                continue;
            const candidates = board.pieces(color, 'rook').intersect(backrank);
            for (const rook of unmovedRooks.intersect(candidates).reversed()) {
                if (!shredder && rook === candidates.first() && rook < king) {
                    fen += color === 'white' ? 'Q' : 'q';
                }
                else if (!shredder && rook === candidates.last() && king < rook) {
                    fen += color === 'white' ? 'K' : 'k';
                }
                else {
                    const file = FILE_NAMES[squareFile(rook)];
                    fen += color === 'white' ? file.toUpperCase() : file;
                }
            }
        }
        return fen || '-';
    }
    function makeRemainingChecks(checks) {
        return `${checks.white}+${checks.black}`;
    }
    function makeFen(setup, opts) {
        return [
            makeBoardFen(setup.board, opts) + (setup.pockets ? `[${makePockets(setup.pockets)}]` : ''),
            setup.turn[0],
            makeCastlingFen(setup.board, setup.unmovedRooks, opts),
            defined(setup.epSquare) ? makeSquare(setup.epSquare) : '-',
            ...(setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : []),
            ...((opts === null || opts === void 0 ? void 0 : opts.epd) ? [] : [Math.max(0, Math.min(setup.halfmoves, 9999)), Math.max(1, Math.min(setup.fullmoves, 9999))]),
        ].join(' ');
    }

    class GameCtrl {
        constructor(game, stream, root) {
            var _b;
            this.stream = stream;
            this.root = root;
            this.chess = Chess.default();
            this.lastUpdateAt = Date.now();
            this.onUnmount = () => {
                this.stream.close();
                clearInterval(this.redrawInterval);
            };
            this.onUpdate = () => {
                var _b, _c;
                const setup = this.game.initialFen == 'startpos' ? defaultSetup() : parseFen(this.game.initialFen).unwrap();
                this.chess = Chess.fromSetup(setup).unwrap();
                const moves = this.game.state.moves.split(' ').filter((m) => m);
                moves.forEach((uci) => this.chess.play(parseUci(uci)));
                const lastMove = moves[moves.length - 1];
                this.lastMove = lastMove && [lastMove.substr(0, 2), lastMove.substr(2, 2)];
                this.lastUpdateAt = Date.now();
                (_b = this.ground) === null || _b === void 0 ? void 0 : _b.set(this.chessgroundConfig());
                if (this.chess.turn == this.pov)
                    (_c = this.ground) === null || _c === void 0 ? void 0 : _c.playPremove();
            };
            this.timeOf = (color) => this.game.state[`${color[0]}time`];
            this.userMove = async (orig, dest) => {
                var _b;
                (_b = this.ground) === null || _b === void 0 ? void 0 : _b.set({ turnColor: opposite$1(this.pov) });
                await this.root.auth.fetchBody(`/api/board/game/${this.game.id}/move/${orig}${dest}`, { method: 'post' });
            };
            this.resign = async () => {
                await this.root.auth.fetchBody(`/api/board/game/${this.game.id}/resign`, { method: 'post' });
            };
            this.playing = () => this.game.state.status == 'started';
            this.chessgroundConfig = () => ({
                orientation: this.pov,
                fen: makeFen(this.chess.toSetup()),
                lastMove: this.lastMove,
                turnColor: this.chess.turn,
                check: !!this.chess.isCheck(),
                movable: {
                    free: false,
                    color: this.playing() ? this.pov : undefined,
                    dests: chessgroundDests(this.chess),
                },
                events: {
                    move: this.userMove,
                },
            });
            this.setGround = (cg) => (this.ground = cg);
            this.handle = (msg) => {
                switch (msg.type) {
                    case 'gameFull':
                        this.game = msg;
                        this.onUpdate();
                        this.root.redraw();
                        break;
                    case 'gameState':
                        this.game.state = msg;
                        this.onUpdate();
                        this.root.redraw();
                        break;
                    default:
                        console.error(`Unknown message type: ${msg.type}`, msg);
                }
            };
            this.game = game;
            this.pov = this.game.black.id == ((_b = this.root.auth.me) === null || _b === void 0 ? void 0 : _b.id) ? 'black' : 'white';
            this.onUpdate();
            this.redrawInterval = setInterval(root.redraw, 100);
        }
    }
    GameCtrl.open = (root, id) => new Promise(async (resolve) => {
        let ctrl;
        let stream;
        const handler = (msg) => {
            if (ctrl)
                ctrl.handle(msg);
            else {
                // Gets the gameFull object from the first message of the stream,
                // make a GameCtrl from it, then forward the next messages to the ctrl
                ctrl = new GameCtrl(msg, stream, root);
                resolve(ctrl);
            }
        };
        stream = await root.auth.openStream(`/api/board/game/stream/${id}`, {}, handler);
    });

    const formData = (data) => {
        const formData = new FormData();
        for (const k of Object.keys(data))
            formData.append(k, data[k]);
        return formData;
    };

    class OngoingGames {
        constructor() {
            this.games = [];
            this.autoStart = new Set();
            this.onStart = (game) => {
                this.remove(game);
                if (game.compat.board) {
                    this.games.push(game);
                    if (!this.autoStart.has(game.id)) {
                        if (!game.hasMoved)
                            page_js(`/game/${game.gameId}`);
                    }
                    this.autoStart.add(game.id);
                }
                else
                    console.log(`Skipping game ${game.gameId}, not board compatible`);
            };
            this.onFinish = (game) => this.remove(game);
            this.empty = () => {
                this.games = [];
            };
            this.remove = (game) => {
                this.games = this.games.filter(g => g.gameId != game.id);
            };
        }
    }

    class SeekCtrl {
        constructor(stream, root) {
            this.stream = stream;
            this.root = root;
            this.awaitClose = async () => {
                await this.stream.closePromise;
                if (this.root.page == 'seek')
                    page_js('/');
            };
            this.onUnmount = () => this.stream.close();
            this.awaitClose();
        }
    }
    SeekCtrl.make = async (config, root) => {
        const stream = await root.auth.openStream('/api/board/seek', {
            method: 'post',
            body: formData(config),
        }, _ => { });
        return new SeekCtrl(stream, root);
    };

    class ChallengeCtrl {
        constructor(stream, root) {
            this.stream = stream;
            this.root = root;
            this.awaitClose = async () => {
                await this.stream.closePromise;
                if (this.root.page == 'challenge')
                    page_js('/');
            };
            this.onUnmount = () => this.stream.close();
            this.awaitClose();
        }
    }
    ChallengeCtrl.make = async (config, root) => {
        const stream = await root.auth.openStream(`/api/challenge/${config.username}`, {
            method: 'post',
            body: formData(Object.assign(Object.assign({}, config), { keepAliveStream: true })),
        }, _ => { });
        return new ChallengeCtrl(stream, root);
    };

    class TvCtrl {
        constructor(stream, game, root) {
            this.stream = stream;
            this.game = game;
            this.root = root;
            this.chess = Chess.default();
            this.lastUpdateAt = Date.now();
            this.awaitClose = async () => {
                await this.stream.closePromise;
            };
            this.onUnmount = () => {
                this.stream.close();
                clearInterval(this.redrawInterval);
            };
            this.player = (color) => this.game.players[this.game.players[0].color == color ? 0 : 1];
            this.chessgroundConfig = () => {
                const chess = Chess.fromSetup(parseFen(this.game.fen).unwrap()).unwrap();
                const lm = this.game.lastMove;
                const lastMove = (lm ? (lm[1] === '@' ? [lm.slice(2)] : [lm[0] + lm[1], lm[2] + lm[3]]) : []);
                return {
                    orientation: this.game.orientation,
                    fen: this.game.fen,
                    lastMove,
                    turnColor: chess.turn,
                    check: !!chess.isCheck(),
                    viewOnly: true,
                    movable: { free: false },
                    drawable: { visible: false },
                    coordinates: false,
                };
            };
            this.setGround = (cg) => (this.ground = cg);
            this.onUpdate = () => {
                this.chess = Chess.fromSetup(parseFen(this.game.fen).unwrap()).unwrap();
                this.lastUpdateAt = Date.now();
            };
            this.handle = (msg) => {
                var _b;
                switch (msg.t) {
                    case 'featured':
                        this.game = msg.d;
                        this.onUpdate();
                        this.root.redraw();
                        break;
                    case 'fen':
                        this.game.fen = msg.d.fen;
                        this.game.lastMove = msg.d.lm;
                        this.player('white').seconds = msg.d.wc;
                        this.player('black').seconds = msg.d.bc;
                        this.onUpdate();
                        (_b = this.ground) === null || _b === void 0 ? void 0 : _b.set(this.chessgroundConfig());
                        break;
                }
            };
            this.onUpdate();
            this.redrawInterval = setInterval(root.redraw, 100);
            this.awaitClose();
        }
    }
    TvCtrl.open = (root) => new Promise(async (resolve) => {
        let ctrl;
        let stream;
        const handler = (msg) => {
            if (ctrl)
                ctrl.handle(msg);
            else {
                // Gets the first game object from the first message of the stream,
                // make a TvCtrl from it, then forward the next messages to the ctrl
                ctrl = new TvCtrl(stream, msg.d, root);
                resolve(ctrl);
            }
        };
        stream = await root.auth.openStream('/api/tv/feed', {}, handler);
    });

    class Ctrl {
        constructor(redraw) {
            this.redraw = redraw;
            this.auth = new Auth();
            this.page = 'home';
            this.games = new OngoingGames();
            this.openHome = async () => {
                var _a;
                this.page = 'home';
                if (this.auth.me) {
                    await ((_a = this.stream) === null || _a === void 0 ? void 0 : _a.close());
                    this.games.empty();
                    this.stream = await this.auth.openStream('/api/stream/event', {}, msg => {
                        switch (msg.type) {
                            case 'gameStart':
                                this.games.onStart(msg.game);
                                break;
                            case 'gameFinish':
                                this.games.onFinish(msg.game);
                                break;
                            default:
                                console.warn(`Unprocessed message of type ${msg.type}`, msg);
                        }
                        this.redraw();
                    });
                }
                this.redraw();
            };
            this.openGame = async (id) => {
                this.page = 'game';
                this.game = undefined;
                this.redraw();
                this.game = await GameCtrl.open(this, id);
                this.redraw();
            };
            this.playAi = async (level, fen) => {
                this.game = undefined;
                this.page = 'game';
                this.redraw();
                await this.auth.fetchBody('/api/challenge/ai', {
                    method: 'post',
                    body: formData({
                        level: level,
                        fen
                    }),
                });
            };
            this.playPool = async (minutes, increment) => {
                this.seek = await SeekCtrl.make({
                    rated: false,
                    time: minutes,
                    increment,
                }, this);
                this.page = 'seek';
                this.redraw();
            };
            this.playMaia = async (fen, username) => {
                this.challenge = await ChallengeCtrl.make({
                    username,
                    rated: false,
                    'clock.limit': 10 * 60,
                    'clock.increment': 3,
                    fen: fen,
                }, this);
                this.page = 'challenge';
                this.redraw();
            };
            this.watchTv = async () => {
                this.page = 'tv';
                this.redraw();
                this.tv = await TvCtrl.open(this);
                this.redraw();
            };
        }
    }

    function colorpicker() {
        return h('li.nav-item.colorpicker', h('input#colorpicker', {
            attrs: {
                type: 'color',
                value: localStorage.getItem('board.color') || defaultColor,
            },
            on: {
                input: e => setColor(e.target.value),
            },
            hook: {
                insert: () => setColor(localStorage.getItem('board.color') || defaultColor),
            },
        }));
    }
    const defaultColor = '#b37c23';
    const setColor = (color) => {
        document.body.style.setProperty('--board-color', color);
        localStorage.setItem('board.color', color);
    };

    function layout (ctrl, body) {
        return h('body', [renderNavBar(ctrl), h('div.container', body)]);
    }
    const renderNavBar = (ctrl) => h('header.navbar.navbar-expand-md.navbar-dark.bg-dark', [
        h('div.container', [
            h('a.navbar-brand', {
                attrs: href('/'),
            }, 'Random Chess Positions'),
            h('button.navbar-toggler', {
                attrs: {
                    type: 'button',
                    'data-bs-toggle': 'collapse',
                    'data-bs-target': '#navbarSupportedContent',
                    'aria-controls': 'navbarSupportedContent',
                    'aria-expanded': false,
                    'aria-label': 'Toggle navigation',
                },
            }, h('span.navbar-toggler-icon')),
            h('div#navbarSupportedContent.collapse.navbar-collapse', [
                h('ul.navbar-nav.me-auto.mb-lg-0"', [
                    h('li.nav-item', h('a.nav-link', {
                        class: { active: ctrl.page == 'tv' },
                        attrs: href('/tv'),
                    }, 'Watch TV')),
                ]),
                h('ul.navbar-nav', [colorpicker(), ctrl.auth.me ? userNav(ctrl.auth.me) : anonNav()]),
            ]),
        ]),
    ]);
    const userNav = (me) => h('li.nav-item.dropdown', [
        h('a#navbarDropdown.nav-link.dropdown-toggle', {
            attrs: {
                href: '#',
                role: 'button',
                'data-bs-toggle': 'dropdown',
                'aria-expanded': false,
            },
        }, me.username),
        h('ul.dropdown-menu', {
            attrs: {
                'aria-labelledby': 'navbarDropdown',
            },
        }, [
            h('li', h('a.dropdown-item', {
                attrs: href('/logout'),
            }, 'Log out')),
        ]),
    ]);
    const anonNav = () => h('li.nav-item', h('a.btn.btn-primary.text-nowrap', {
        attrs: href('/login'),
    }, 'Login with Lichess'));

    const renderChallenge = ctrl => _ => [
        h('div.challenge-page', {
            hook: {
                destroy: ctrl.onUnmount,
            },
        }, [
            h('div.challenge-page__awaiting', [spinner(), h('span.ms-3', 'Awaiting the opponent...')]),
            h('a.btn.btn-secondary', {
                attrs: { href: url('/') },
            }, 'Cancel'),
        ]),
    ];

    const colors = ['white', 'black'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const invRanks = [...ranks].reverse();
    const allKeys = Array.prototype.concat(...files.map(c => ranks.map(r => c + r)));
    const pos2key = (pos) => allKeys[8 * pos[0] + pos[1]];
    const key2pos = (k) => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];
    const allPos = allKeys.map(key2pos);
    function memo(f) {
        let v;
        const ret = () => {
            if (v === undefined)
                v = f();
            return v;
        };
        ret.clear = () => {
            v = undefined;
        };
        return ret;
    }
    const timer = () => {
        let startAt;
        return {
            start() {
                startAt = performance.now();
            },
            cancel() {
                startAt = undefined;
            },
            stop() {
                if (!startAt)
                    return 0;
                const time = performance.now() - startAt;
                startAt = undefined;
                return time;
            },
        };
    };
    const opposite = (c) => (c === 'white' ? 'black' : 'white');
    const distanceSq = (pos1, pos2) => {
        const dx = pos1[0] - pos2[0], dy = pos1[1] - pos2[1];
        return dx * dx + dy * dy;
    };
    const samePiece = (p1, p2) => p1.role === p2.role && p1.color === p2.color;
    const posToTranslate = (bounds) => (pos, asWhite) => [((asWhite ? pos[0] : 7 - pos[0]) * bounds.width) / 8, ((asWhite ? 7 - pos[1] : pos[1]) * bounds.height) / 8];
    const translate = (el, pos) => {
        el.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
    };
    const translateAndScale = (el, pos, scale = 1) => {
        el.style.transform = `translate(${pos[0]}px,${pos[1]}px) scale(${scale})`;
    };
    const setVisible = (el, v) => {
        el.style.visibility = v ? 'visible' : 'hidden';
    };
    const eventPosition = (e) => {
        var _a;
        if (e.clientX || e.clientX === 0)
            return [e.clientX, e.clientY];
        if ((_a = e.targetTouches) === null || _a === void 0 ? void 0 : _a[0])
            return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
        return; // touchend has no position!
    };
    const isRightButton = (e) => e.buttons === 2 || e.button === 2;
    const createEl = (tagName, className) => {
        const el = document.createElement(tagName);
        if (className)
            el.className = className;
        return el;
    };
    function computeSquareCenter(key, asWhite, bounds) {
        const pos = key2pos(key);
        if (!asWhite) {
            pos[0] = 7 - pos[0];
            pos[1] = 7 - pos[1];
        }
        return [
            bounds.left + (bounds.width * pos[0]) / 8 + bounds.width / 16,
            bounds.top + (bounds.height * (7 - pos[1])) / 8 + bounds.height / 16,
        ];
    }

    function clockContent(time, decay) {
        if (!time && time !== 0)
            return h('span', '-');
        if (time == 2147483647)
            return h('span');
        const millis = time + (decay || 0);
        return millis > 1000 * 60 * 60 * 24 ? correspondence(millis) : realTime(millis);
    }
    const realTime = (millis) => {
        const date = new Date(millis);
        return h('span.clock--realtime.font-monospace', [
            pad2(date.getUTCMinutes()) + ':' + pad2(date.getUTCSeconds()),
            h('tenths', '.' + Math.floor(date.getUTCMilliseconds() / 100).toString()),
        ]);
    };
    const correspondence = (ms) => {
        const date = new Date(ms), minutes = prefixInteger(date.getUTCMinutes(), 2), seconds = prefixInteger(date.getSeconds(), 2);
        let hours, str = '';
        if (ms >= 86400 * 1000) {
            // days : hours
            const days = date.getUTCDate() - 1;
            hours = date.getUTCHours();
            str += (days === 1 ? 'One day' : `${days} days`) + ' ';
            if (hours !== 0)
                str += `${hours} hours`;
        }
        else if (ms >= 3600 * 1000) {
            // hours : minutes
            hours = date.getUTCHours();
            str += bold(prefixInteger(hours, 2)) + ':' + bold(minutes);
        }
        else {
            // minutes : seconds
            str += bold(minutes) + ':' + bold(seconds);
        }
        return h('span.clock--correspondence', str);
    };
    const pad2 = (num) => (num < 10 ? '0' : '') + num;
    const prefixInteger = (num, length) => (num / Math.pow(10, length)).toFixed(length).slice(2);
    const bold = (x) => `<b>${x}</b>`;

    function diff(a, b) {
        return Math.abs(a - b);
    }
    function pawn(color) {
        return (x1, y1, x2, y2) => diff(x1, x2) < 2 &&
            (color === 'white'
                ? // allow 2 squares from first two ranks, for horde
                    y2 === y1 + 1 || (y1 <= 1 && y2 === y1 + 2 && x1 === x2)
                : y2 === y1 - 1 || (y1 >= 6 && y2 === y1 - 2 && x1 === x2));
    }
    const knight = (x1, y1, x2, y2) => {
        const xd = diff(x1, x2);
        const yd = diff(y1, y2);
        return (xd === 1 && yd === 2) || (xd === 2 && yd === 1);
    };
    const bishop = (x1, y1, x2, y2) => {
        return diff(x1, x2) === diff(y1, y2);
    };
    const rook = (x1, y1, x2, y2) => {
        return x1 === x2 || y1 === y2;
    };
    const queen = (x1, y1, x2, y2) => {
        return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
    };
    function king(color, rookFiles, canCastle) {
        return (x1, y1, x2, y2) => (diff(x1, x2) < 2 && diff(y1, y2) < 2) ||
            (canCastle &&
                y1 === y2 &&
                y1 === (color === 'white' ? 0 : 7) &&
                ((x1 === 4 && ((x2 === 2 && rookFiles.includes(0)) || (x2 === 6 && rookFiles.includes(7)))) ||
                    rookFiles.includes(x2)));
    }
    function rookFilesOf(pieces, color) {
        const backrank = color === 'white' ? '1' : '8';
        const files = [];
        for (const [key, piece] of pieces) {
            if (key[1] === backrank && piece.color === color && piece.role === 'rook') {
                files.push(key2pos(key)[0]);
            }
        }
        return files;
    }
    function premove(pieces, key, canCastle) {
        const piece = pieces.get(key);
        if (!piece)
            return [];
        const pos = key2pos(key), r = piece.role, mobility = r === 'pawn'
            ? pawn(piece.color)
            : r === 'knight'
                ? knight
                : r === 'bishop'
                    ? bishop
                    : r === 'rook'
                        ? rook
                        : r === 'queen'
                            ? queen
                            : king(piece.color, rookFilesOf(pieces, piece.color), canCastle);
        return allPos
            .filter(pos2 => (pos[0] !== pos2[0] || pos[1] !== pos2[1]) && mobility(pos[0], pos[1], pos2[0], pos2[1]))
            .map(pos2key);
    }

    function callUserFunction(f, ...args) {
        if (f)
            setTimeout(() => f(...args), 1);
    }
    function toggleOrientation(state) {
        state.orientation = opposite(state.orientation);
        state.animation.current = state.draggable.current = state.selected = undefined;
    }
    function setPieces(state, pieces) {
        for (const [key, piece] of pieces) {
            if (piece)
                state.pieces.set(key, piece);
            else
                state.pieces.delete(key);
        }
    }
    function setCheck(state, color) {
        state.check = undefined;
        if (color === true)
            color = state.turnColor;
        if (color)
            for (const [k, p] of state.pieces) {
                if (p.role === 'king' && p.color === color) {
                    state.check = k;
                }
            }
    }
    function setPremove(state, orig, dest, meta) {
        unsetPredrop(state);
        state.premovable.current = [orig, dest];
        callUserFunction(state.premovable.events.set, orig, dest, meta);
    }
    function unsetPremove(state) {
        if (state.premovable.current) {
            state.premovable.current = undefined;
            callUserFunction(state.premovable.events.unset);
        }
    }
    function setPredrop(state, role, key) {
        unsetPremove(state);
        state.predroppable.current = { role, key };
        callUserFunction(state.predroppable.events.set, role, key);
    }
    function unsetPredrop(state) {
        const pd = state.predroppable;
        if (pd.current) {
            pd.current = undefined;
            callUserFunction(pd.events.unset);
        }
    }
    function tryAutoCastle(state, orig, dest) {
        if (!state.autoCastle)
            return false;
        const king = state.pieces.get(orig);
        if (!king || king.role !== 'king')
            return false;
        const origPos = key2pos(orig);
        const destPos = key2pos(dest);
        if ((origPos[1] !== 0 && origPos[1] !== 7) || origPos[1] !== destPos[1])
            return false;
        if (origPos[0] === 4 && !state.pieces.has(dest)) {
            if (destPos[0] === 6)
                dest = pos2key([7, destPos[1]]);
            else if (destPos[0] === 2)
                dest = pos2key([0, destPos[1]]);
        }
        const rook = state.pieces.get(dest);
        if (!rook || rook.color !== king.color || rook.role !== 'rook')
            return false;
        state.pieces.delete(orig);
        state.pieces.delete(dest);
        if (origPos[0] < destPos[0]) {
            state.pieces.set(pos2key([6, destPos[1]]), king);
            state.pieces.set(pos2key([5, destPos[1]]), rook);
        }
        else {
            state.pieces.set(pos2key([2, destPos[1]]), king);
            state.pieces.set(pos2key([3, destPos[1]]), rook);
        }
        return true;
    }
    function baseMove(state, orig, dest) {
        const origPiece = state.pieces.get(orig), destPiece = state.pieces.get(dest);
        if (orig === dest || !origPiece)
            return false;
        const captured = destPiece && destPiece.color !== origPiece.color ? destPiece : undefined;
        if (dest === state.selected)
            unselect(state);
        callUserFunction(state.events.move, orig, dest, captured);
        if (!tryAutoCastle(state, orig, dest)) {
            state.pieces.set(dest, origPiece);
            state.pieces.delete(orig);
        }
        state.lastMove = [orig, dest];
        state.check = undefined;
        callUserFunction(state.events.change);
        return captured || true;
    }
    function baseNewPiece(state, piece, key, force) {
        if (state.pieces.has(key)) {
            if (force)
                state.pieces.delete(key);
            else
                return false;
        }
        callUserFunction(state.events.dropNewPiece, piece, key);
        state.pieces.set(key, piece);
        state.lastMove = [key];
        state.check = undefined;
        callUserFunction(state.events.change);
        state.movable.dests = undefined;
        state.turnColor = opposite(state.turnColor);
        return true;
    }
    function baseUserMove(state, orig, dest) {
        const result = baseMove(state, orig, dest);
        if (result) {
            state.movable.dests = undefined;
            state.turnColor = opposite(state.turnColor);
            state.animation.current = undefined;
        }
        return result;
    }
    function userMove(state, orig, dest) {
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const holdTime = state.hold.stop();
                unselect(state);
                const metadata = {
                    premove: false,
                    ctrlKey: state.stats.ctrlKey,
                    holdTime,
                };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                return true;
            }
        }
        else if (canPremove(state, orig, dest)) {
            setPremove(state, orig, dest, {
                ctrlKey: state.stats.ctrlKey,
            });
            unselect(state);
            return true;
        }
        unselect(state);
        return false;
    }
    function dropNewPiece(state, orig, dest, force) {
        const piece = state.pieces.get(orig);
        if (piece && (canDrop(state, orig, dest) || force)) {
            state.pieces.delete(orig);
            baseNewPiece(state, piece, dest, force);
            callUserFunction(state.movable.events.afterNewPiece, piece.role, dest, {
                premove: false,
                predrop: false,
            });
        }
        else if (piece && canPredrop(state, orig, dest)) {
            setPredrop(state, piece.role, dest);
        }
        else {
            unsetPremove(state);
            unsetPredrop(state);
        }
        state.pieces.delete(orig);
        unselect(state);
    }
    function selectSquare(state, key, force) {
        callUserFunction(state.events.select, key);
        if (state.selected) {
            if (state.selected === key && !state.draggable.enabled) {
                unselect(state);
                state.hold.cancel();
                return;
            }
            else if ((state.selectable.enabled || force) && state.selected !== key) {
                if (userMove(state, state.selected, key)) {
                    state.stats.dragged = false;
                    return;
                }
            }
        }
        if (isMovable(state, key) || isPremovable(state, key)) {
            setSelected(state, key);
            state.hold.start();
        }
    }
    function setSelected(state, key) {
        state.selected = key;
        if (isPremovable(state, key)) {
            state.premovable.dests = premove(state.pieces, key, state.premovable.castle);
        }
        else
            state.premovable.dests = undefined;
    }
    function unselect(state) {
        state.selected = undefined;
        state.premovable.dests = undefined;
        state.hold.cancel();
    }
    function isMovable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    function canMove(state, orig, dest) {
        var _a, _b;
        return (orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_b = (_a = state.movable.dests) === null || _a === void 0 ? void 0 : _a.get(orig)) === null || _b === void 0 ? void 0 : _b.includes(dest))));
    }
    function canDrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            (orig === dest || !state.pieces.has(dest)) &&
            (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color)));
    }
    function isPremovable(state, orig) {
        const piece = state.pieces.get(orig);
        return !!piece && state.premovable.enabled && state.movable.color === piece.color && state.turnColor !== piece.color;
    }
    function canPremove(state, orig, dest) {
        return (orig !== dest && isPremovable(state, orig) && premove(state.pieces, orig, state.premovable.castle).includes(dest));
    }
    function canPredrop(state, orig, dest) {
        const piece = state.pieces.get(orig);
        const destPiece = state.pieces.get(dest);
        return (!!piece &&
            (!destPiece || destPiece.color !== state.movable.color) &&
            state.predroppable.enabled &&
            (piece.role !== 'pawn' || (dest[1] !== '1' && dest[1] !== '8')) &&
            state.movable.color === piece.color &&
            state.turnColor !== piece.color);
    }
    function isDraggable(state, orig) {
        const piece = state.pieces.get(orig);
        return (!!piece &&
            state.draggable.enabled &&
            (state.movable.color === 'both' ||
                (state.movable.color === piece.color && (state.turnColor === piece.color || state.premovable.enabled))));
    }
    function playPremove(state) {
        const move = state.premovable.current;
        if (!move)
            return false;
        const orig = move[0], dest = move[1];
        let success = false;
        if (canMove(state, orig, dest)) {
            const result = baseUserMove(state, orig, dest);
            if (result) {
                const metadata = { premove: true };
                if (result !== true)
                    metadata.captured = result;
                callUserFunction(state.movable.events.after, orig, dest, metadata);
                success = true;
            }
        }
        unsetPremove(state);
        return success;
    }
    function playPredrop(state, validate) {
        const drop = state.predroppable.current;
        let success = false;
        if (!drop)
            return false;
        if (validate(drop)) {
            const piece = {
                role: drop.role,
                color: state.movable.color,
            };
            if (baseNewPiece(state, piece, drop.key)) {
                callUserFunction(state.movable.events.afterNewPiece, drop.role, drop.key, {
                    premove: false,
                    predrop: true,
                });
                success = true;
            }
        }
        unsetPredrop(state);
        return success;
    }
    function cancelMove(state) {
        unsetPremove(state);
        unsetPredrop(state);
        unselect(state);
    }
    function stop(state) {
        state.movable.color = state.movable.dests = state.animation.current = undefined;
        cancelMove(state);
    }
    function getKeyAtDomPos(pos, asWhite, bounds) {
        let file = Math.floor((8 * (pos[0] - bounds.left)) / bounds.width);
        if (!asWhite)
            file = 7 - file;
        let rank = 7 - Math.floor((8 * (pos[1] - bounds.top)) / bounds.height);
        if (!asWhite)
            rank = 7 - rank;
        return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? pos2key([file, rank]) : undefined;
    }
    function getSnappedKeyAtDomPos(orig, pos, asWhite, bounds) {
        const origPos = key2pos(orig);
        const validSnapPos = allPos.filter(pos2 => {
            return queen(origPos[0], origPos[1], pos2[0], pos2[1]) || knight(origPos[0], origPos[1], pos2[0], pos2[1]);
        });
        const validSnapCenters = validSnapPos.map(pos2 => computeSquareCenter(pos2key(pos2), asWhite, bounds));
        const validSnapDistances = validSnapCenters.map(pos2 => distanceSq(pos, pos2));
        const [, closestSnapIndex] = validSnapDistances.reduce((a, b, index) => (a[0] < b ? a : [b, index]), [validSnapDistances[0], 0]);
        return pos2key(validSnapPos[closestSnapIndex]);
    }
    function whitePov(s) {
        return s.orientation === 'white';
    }

    const initial = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
    const roles = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
    };
    const letters = {
        pawn: 'p',
        rook: 'r',
        knight: 'n',
        bishop: 'b',
        queen: 'q',
        king: 'k',
    };
    function read$1(fen) {
        if (fen === 'start')
            fen = initial;
        const pieces = new Map();
        let row = 7, col = 0;
        for (const c of fen) {
            switch (c) {
                case ' ':
                case '[':
                    return pieces;
                case '/':
                    --row;
                    if (row < 0)
                        return pieces;
                    col = 0;
                    break;
                case '~': {
                    const piece = pieces.get(pos2key([col - 1, row]));
                    if (piece)
                        piece.promoted = true;
                    break;
                }
                default: {
                    const nb = c.charCodeAt(0);
                    if (nb < 57)
                        col += nb - 48;
                    else {
                        const role = c.toLowerCase();
                        pieces.set(pos2key([col, row]), {
                            role: roles[role],
                            color: c === role ? 'black' : 'white',
                        });
                        ++col;
                    }
                }
            }
        }
        return pieces;
    }
    function write$1(pieces) {
        return invRanks
            .map(y => files
            .map(x => {
            const piece = pieces.get((x + y));
            if (piece) {
                let p = letters[piece.role];
                if (piece.color === 'white')
                    p = p.toUpperCase();
                if (piece.promoted)
                    p += '~';
                return p;
            }
            else
                return '1';
        })
            .join(''))
            .join('/')
            .replace(/1{2,}/g, s => s.length.toString());
    }

    function applyAnimation(state, config) {
        if (config.animation) {
            deepMerge(state.animation, config.animation);
            // no need for such short animations
            if ((state.animation.duration || 0) < 70)
                state.animation.enabled = false;
        }
    }
    function configure(state, config) {
        var _a, _b;
        // don't merge destinations and autoShapes. Just override.
        if ((_a = config.movable) === null || _a === void 0 ? void 0 : _a.dests)
            state.movable.dests = undefined;
        if ((_b = config.drawable) === null || _b === void 0 ? void 0 : _b.autoShapes)
            state.drawable.autoShapes = [];
        deepMerge(state, config);
        // if a fen was provided, replace the pieces
        if (config.fen) {
            state.pieces = read$1(config.fen);
            state.drawable.shapes = [];
        }
        // apply config values that could be undefined yet meaningful
        if ('check' in config)
            setCheck(state, config.check || false);
        if ('lastMove' in config && !config.lastMove)
            state.lastMove = undefined;
        // in case of ZH drop last move, there's a single square.
        // if the previous last move had two squares,
        // the merge algorithm will incorrectly keep the second square.
        else if (config.lastMove)
            state.lastMove = config.lastMove;
        // fix move/premove dests
        if (state.selected)
            setSelected(state, state.selected);
        applyAnimation(state, config);
        if (!state.movable.rookCastle && state.movable.dests) {
            const rank = state.movable.color === 'white' ? '1' : '8', kingStartPos = ('e' + rank), dests = state.movable.dests.get(kingStartPos), king = state.pieces.get(kingStartPos);
            if (!dests || !king || king.role !== 'king')
                return;
            state.movable.dests.set(kingStartPos, dests.filter(d => !(d === 'a' + rank && dests.includes(('c' + rank))) &&
                !(d === 'h' + rank && dests.includes(('g' + rank)))));
        }
    }
    function deepMerge(base, extend) {
        for (const key in extend) {
            if (isObject(base[key]) && isObject(extend[key]))
                deepMerge(base[key], extend[key]);
            else
                base[key] = extend[key];
        }
    }
    function isObject(o) {
        return typeof o === 'object';
    }

    function anim(mutation, state) {
        return state.animation.enabled ? animate(mutation, state) : render$2(mutation, state);
    }
    function render$2(mutation, state) {
        const result = mutation(state);
        state.dom.redraw();
        return result;
    }
    function makePiece(key, piece) {
        return {
            key: key,
            pos: key2pos(key),
            piece: piece,
        };
    }
    function closer(piece, pieces) {
        return pieces.sort((p1, p2) => {
            return distanceSq(piece.pos, p1.pos) - distanceSq(piece.pos, p2.pos);
        })[0];
    }
    function computePlan(prevPieces, current) {
        const anims = new Map(), animedOrigs = [], fadings = new Map(), missings = [], news = [], prePieces = new Map();
        let curP, preP, vector;
        for (const [k, p] of prevPieces) {
            prePieces.set(k, makePiece(k, p));
        }
        for (const key of allKeys) {
            curP = current.pieces.get(key);
            preP = prePieces.get(key);
            if (curP) {
                if (preP) {
                    if (!samePiece(curP, preP.piece)) {
                        missings.push(preP);
                        news.push(makePiece(key, curP));
                    }
                }
                else
                    news.push(makePiece(key, curP));
            }
            else if (preP)
                missings.push(preP);
        }
        for (const newP of news) {
            preP = closer(newP, missings.filter(p => samePiece(newP.piece, p.piece)));
            if (preP) {
                vector = [preP.pos[0] - newP.pos[0], preP.pos[1] - newP.pos[1]];
                anims.set(newP.key, vector.concat(vector));
                animedOrigs.push(preP.key);
            }
        }
        for (const p of missings) {
            if (!animedOrigs.includes(p.key))
                fadings.set(p.key, p.piece);
        }
        return {
            anims: anims,
            fadings: fadings,
        };
    }
    function step(state, now) {
        const cur = state.animation.current;
        if (cur === undefined) {
            // animation was canceled :(
            if (!state.dom.destroyed)
                state.dom.redrawNow();
            return;
        }
        const rest = 1 - (now - cur.start) * cur.frequency;
        if (rest <= 0) {
            state.animation.current = undefined;
            state.dom.redrawNow();
        }
        else {
            const ease = easing(rest);
            for (const cfg of cur.plan.anims.values()) {
                cfg[2] = cfg[0] * ease;
                cfg[3] = cfg[1] * ease;
            }
            state.dom.redrawNow(true); // optimisation: don't render SVG changes during animations
            requestAnimationFrame((now = performance.now()) => step(state, now));
        }
    }
    function animate(mutation, state) {
        // clone state before mutating it
        const prevPieces = new Map(state.pieces);
        const result = mutation(state);
        const plan = computePlan(prevPieces, state);
        if (plan.anims.size || plan.fadings.size) {
            const alreadyRunning = state.animation.current && state.animation.current.start;
            state.animation.current = {
                start: performance.now(),
                frequency: 1 / state.animation.duration,
                plan: plan,
            };
            if (!alreadyRunning)
                step(state, performance.now());
        }
        else {
            // don't animate, just render right away
            state.dom.redraw();
        }
        return result;
    }
    // https://gist.github.com/gre/1650294
    function easing(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    const brushes = ['green', 'red', 'blue', 'yellow'];
    function start$3(state, e) {
        // support one finger touch only
        if (e.touches && e.touches.length > 1)
            return;
        e.stopPropagation();
        e.preventDefault();
        e.ctrlKey ? unselect(state) : cancelMove(state);
        const pos = eventPosition(e), orig = getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
        if (!orig)
            return;
        state.drawable.current = {
            orig,
            pos,
            brush: eventBrush(e),
            snapToValidMove: state.drawable.defaultSnapToValidMove,
        };
        processDraw(state);
    }
    function processDraw(state) {
        requestAnimationFrame(() => {
            const cur = state.drawable.current;
            if (cur) {
                const keyAtDomPos = getKeyAtDomPos(cur.pos, whitePov(state), state.dom.bounds());
                if (!keyAtDomPos) {
                    cur.snapToValidMove = false;
                }
                const mouseSq = cur.snapToValidMove
                    ? getSnappedKeyAtDomPos(cur.orig, cur.pos, whitePov(state), state.dom.bounds())
                    : keyAtDomPos;
                if (mouseSq !== cur.mouseSq) {
                    cur.mouseSq = mouseSq;
                    cur.dest = mouseSq !== cur.orig ? mouseSq : undefined;
                    state.dom.redrawNow();
                }
                processDraw(state);
            }
        });
    }
    function move$1(state, e) {
        if (state.drawable.current)
            state.drawable.current.pos = eventPosition(e);
    }
    function end$2(state) {
        const cur = state.drawable.current;
        if (cur) {
            if (cur.mouseSq)
                addShape(state.drawable, cur);
            cancel$1(state);
        }
    }
    function cancel$1(state) {
        if (state.drawable.current) {
            state.drawable.current = undefined;
            state.dom.redraw();
        }
    }
    function clear(state) {
        if (state.drawable.shapes.length) {
            state.drawable.shapes = [];
            state.dom.redraw();
            onChange(state.drawable);
        }
    }
    function eventBrush(e) {
        var _a;
        const modA = (e.shiftKey || e.ctrlKey) && isRightButton(e);
        const modB = e.altKey || e.metaKey || ((_a = e.getModifierState) === null || _a === void 0 ? void 0 : _a.call(e, 'AltGraph'));
        return brushes[(modA ? 1 : 0) + (modB ? 2 : 0)];
    }
    function addShape(drawable, cur) {
        const sameShape = (s) => s.orig === cur.orig && s.dest === cur.dest;
        const similar = drawable.shapes.find(sameShape);
        if (similar)
            drawable.shapes = drawable.shapes.filter(s => !sameShape(s));
        if (!similar || similar.brush !== cur.brush)
            drawable.shapes.push(cur);
        onChange(drawable);
    }
    function onChange(drawable) {
        if (drawable.onChange)
            drawable.onChange(drawable.shapes);
    }

    function start$2(s, e) {
        if (!e.isTrusted || (e.button !== undefined && e.button !== 0))
            return; // only touch or left click
        if (e.touches && e.touches.length > 1)
            return; // support one finger touch only
        const bounds = s.dom.bounds(), position = eventPosition(e), orig = getKeyAtDomPos(position, whitePov(s), bounds);
        if (!orig)
            return;
        const piece = s.pieces.get(orig);
        const previouslySelected = s.selected;
        if (!previouslySelected && s.drawable.enabled && (s.drawable.eraseOnClick || !piece || piece.color !== s.turnColor))
            clear(s);
        // Prevent touch scroll and create no corresponding mouse event, if there
        // is an intent to interact with the board.
        if (e.cancelable !== false &&
            (!e.touches || s.blockTouchScroll || piece || previouslySelected || pieceCloseTo(s, position)))
            e.preventDefault();
        const hadPremove = !!s.premovable.current;
        const hadPredrop = !!s.predroppable.current;
        s.stats.ctrlKey = e.ctrlKey;
        if (s.selected && canMove(s, s.selected, orig)) {
            anim(state => selectSquare(state, orig), s);
        }
        else {
            selectSquare(s, orig);
        }
        const stillSelected = s.selected === orig;
        const element = pieceElementByKey(s, orig);
        if (piece && element && stillSelected && isDraggable(s, orig)) {
            s.draggable.current = {
                orig,
                piece,
                origPos: position,
                pos: position,
                started: s.draggable.autoDistance && s.stats.dragged,
                element,
                previouslySelected,
                originTarget: e.target,
                keyHasChanged: false,
            };
            element.cgDragging = true;
            element.classList.add('dragging');
            // place ghost
            const ghost = s.dom.elements.ghost;
            if (ghost) {
                ghost.className = `ghost ${piece.color} ${piece.role}`;
                translate(ghost, posToTranslate(bounds)(key2pos(orig), whitePov(s)));
                setVisible(ghost, true);
            }
            processDrag(s);
        }
        else {
            if (hadPremove)
                unsetPremove(s);
            if (hadPredrop)
                unsetPredrop(s);
        }
        s.dom.redraw();
    }
    function pieceCloseTo(s, pos) {
        const asWhite = whitePov(s), bounds = s.dom.bounds(), radiusSq = Math.pow(bounds.width / 8, 2);
        for (const key of s.pieces.keys()) {
            const center = computeSquareCenter(key, asWhite, bounds);
            if (distanceSq(center, pos) <= radiusSq)
                return true;
        }
        return false;
    }
    function dragNewPiece(s, piece, e, force) {
        const key = 'a0';
        s.pieces.set(key, piece);
        s.dom.redraw();
        const position = eventPosition(e);
        s.draggable.current = {
            orig: key,
            piece,
            origPos: position,
            pos: position,
            started: true,
            element: () => pieceElementByKey(s, key),
            originTarget: e.target,
            newPiece: true,
            force: !!force,
            keyHasChanged: false,
        };
        processDrag(s);
    }
    function processDrag(s) {
        requestAnimationFrame(() => {
            var _a;
            const cur = s.draggable.current;
            if (!cur)
                return;
            // cancel animations while dragging
            if ((_a = s.animation.current) === null || _a === void 0 ? void 0 : _a.plan.anims.has(cur.orig))
                s.animation.current = undefined;
            // if moving piece is gone, cancel
            const origPiece = s.pieces.get(cur.orig);
            if (!origPiece || !samePiece(origPiece, cur.piece))
                cancel(s);
            else {
                if (!cur.started && distanceSq(cur.pos, cur.origPos) >= Math.pow(s.draggable.distance, 2))
                    cur.started = true;
                if (cur.started) {
                    // support lazy elements
                    if (typeof cur.element === 'function') {
                        const found = cur.element();
                        if (!found)
                            return;
                        found.cgDragging = true;
                        found.classList.add('dragging');
                        cur.element = found;
                    }
                    const bounds = s.dom.bounds();
                    translate(cur.element, [
                        cur.pos[0] - bounds.left - bounds.width / 16,
                        cur.pos[1] - bounds.top - bounds.height / 16,
                    ]);
                    cur.keyHasChanged || (cur.keyHasChanged = cur.orig !== getKeyAtDomPos(cur.pos, whitePov(s), bounds));
                }
            }
            processDrag(s);
        });
    }
    function move(s, e) {
        // support one finger touch only
        if (s.draggable.current && (!e.touches || e.touches.length < 2)) {
            s.draggable.current.pos = eventPosition(e);
        }
    }
    function end$1(s, e) {
        const cur = s.draggable.current;
        if (!cur)
            return;
        // create no corresponding mouse event
        if (e.type === 'touchend' && e.cancelable !== false)
            e.preventDefault();
        // comparing with the origin target is an easy way to test that the end event
        // has the same touch origin
        if (e.type === 'touchend' && cur.originTarget !== e.target && !cur.newPiece) {
            s.draggable.current = undefined;
            return;
        }
        unsetPremove(s);
        unsetPredrop(s);
        // touchend has no position; so use the last touchmove position instead
        const eventPos = eventPosition(e) || cur.pos;
        const dest = getKeyAtDomPos(eventPos, whitePov(s), s.dom.bounds());
        if (dest && cur.started && cur.orig !== dest) {
            if (cur.newPiece)
                dropNewPiece(s, cur.orig, dest, cur.force);
            else {
                s.stats.ctrlKey = e.ctrlKey;
                if (userMove(s, cur.orig, dest))
                    s.stats.dragged = true;
            }
        }
        else if (cur.newPiece) {
            s.pieces.delete(cur.orig);
        }
        else if (s.draggable.deleteOnDropOff && !dest) {
            s.pieces.delete(cur.orig);
            callUserFunction(s.events.change);
        }
        if ((cur.orig === cur.previouslySelected || cur.keyHasChanged) && (cur.orig === dest || !dest))
            unselect(s);
        else if (!s.selectable.enabled)
            unselect(s);
        removeDragElements(s);
        s.draggable.current = undefined;
        s.dom.redraw();
    }
    function cancel(s) {
        const cur = s.draggable.current;
        if (cur) {
            if (cur.newPiece)
                s.pieces.delete(cur.orig);
            s.draggable.current = undefined;
            unselect(s);
            removeDragElements(s);
            s.dom.redraw();
        }
    }
    function removeDragElements(s) {
        const e = s.dom.elements;
        if (e.ghost)
            setVisible(e.ghost, false);
    }
    function pieceElementByKey(s, key) {
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if (el.cgKey === key && el.tagName === 'PIECE')
                return el;
            el = el.nextSibling;
        }
        return;
    }

    function explosion(state, keys) {
        state.exploding = { stage: 1, keys };
        state.dom.redraw();
        setTimeout(() => {
            setStage(state, 2);
            setTimeout(() => setStage(state, undefined), 120);
        }, 120);
    }
    function setStage(state, stage) {
        if (state.exploding) {
            if (stage)
                state.exploding.stage = stage;
            else
                state.exploding = undefined;
            state.dom.redraw();
        }
    }

    // see API types and documentations in dts/api.d.ts
    function start$1(state, redrawAll) {
        function toggleOrientation$1() {
            toggleOrientation(state);
            redrawAll();
        }
        return {
            set(config) {
                if (config.orientation && config.orientation !== state.orientation)
                    toggleOrientation$1();
                applyAnimation(state, config);
                (config.fen ? anim : render$2)(state => configure(state, config), state);
            },
            state,
            getFen: () => write$1(state.pieces),
            toggleOrientation: toggleOrientation$1,
            setPieces(pieces) {
                anim(state => setPieces(state, pieces), state);
            },
            selectSquare(key, force) {
                if (key)
                    anim(state => selectSquare(state, key, force), state);
                else if (state.selected) {
                    unselect(state);
                    state.dom.redraw();
                }
            },
            move(orig, dest) {
                anim(state => baseMove(state, orig, dest), state);
            },
            newPiece(piece, key) {
                anim(state => baseNewPiece(state, piece, key), state);
            },
            playPremove() {
                if (state.premovable.current) {
                    if (anim(playPremove, state))
                        return true;
                    // if the premove couldn't be played, redraw to clear it up
                    state.dom.redraw();
                }
                return false;
            },
            playPredrop(validate) {
                if (state.predroppable.current) {
                    const result = playPredrop(state, validate);
                    state.dom.redraw();
                    return result;
                }
                return false;
            },
            cancelPremove() {
                render$2(unsetPremove, state);
            },
            cancelPredrop() {
                render$2(unsetPredrop, state);
            },
            cancelMove() {
                render$2(state => {
                    cancelMove(state);
                    cancel(state);
                }, state);
            },
            stop() {
                render$2(state => {
                    stop(state);
                    cancel(state);
                }, state);
            },
            explode(keys) {
                explosion(state, keys);
            },
            setAutoShapes(shapes) {
                render$2(state => (state.drawable.autoShapes = shapes), state);
            },
            setShapes(shapes) {
                render$2(state => (state.drawable.shapes = shapes), state);
            },
            getKeyAtDomPos(pos) {
                return getKeyAtDomPos(pos, whitePov(state), state.dom.bounds());
            },
            redrawAll,
            dragNewPiece(piece, event, force) {
                dragNewPiece(state, piece, event, force);
            },
            destroy() {
                stop(state);
                state.dom.unbind && state.dom.unbind();
                state.dom.destroyed = true;
            },
        };
    }

    function defaults() {
        return {
            pieces: read$1(initial),
            orientation: 'white',
            turnColor: 'white',
            coordinates: true,
            ranksPosition: 'right',
            autoCastle: true,
            viewOnly: false,
            disableContextMenu: false,
            addPieceZIndex: false,
            addDimensionsCssVars: false,
            blockTouchScroll: false,
            pieceKey: false,
            highlight: {
                lastMove: true,
                check: true,
            },
            animation: {
                enabled: true,
                duration: 200,
            },
            movable: {
                free: true,
                color: 'both',
                showDests: true,
                events: {},
                rookCastle: true,
            },
            premovable: {
                enabled: true,
                showDests: true,
                castle: true,
                events: {},
            },
            predroppable: {
                enabled: false,
                events: {},
            },
            draggable: {
                enabled: true,
                distance: 3,
                autoDistance: true,
                showGhost: true,
                deleteOnDropOff: false,
            },
            dropmode: {
                active: false,
            },
            selectable: {
                enabled: true,
            },
            stats: {
                // on touchscreen, default to "tap-tap" moves
                // instead of drag
                dragged: !('ontouchstart' in window),
            },
            events: {},
            drawable: {
                enabled: true,
                visible: true,
                defaultSnapToValidMove: true,
                eraseOnClick: true,
                shapes: [],
                autoShapes: [],
                brushes: {
                    green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
                    red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
                    blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
                    yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 },
                    paleBlue: { key: 'pb', color: '#003088', opacity: 0.4, lineWidth: 15 },
                    paleGreen: { key: 'pg', color: '#15781B', opacity: 0.4, lineWidth: 15 },
                    paleRed: { key: 'pr', color: '#882020', opacity: 0.4, lineWidth: 15 },
                    paleGrey: {
                        key: 'pgr',
                        color: '#4a4a4a',
                        opacity: 0.35,
                        lineWidth: 15,
                    },
                },
                prevSvgHash: '',
            },
            hold: timer(),
        };
    }

    // append and remove only. No updates.
    function syncShapes(shapes, root, renderShape) {
        const hashesInDom = new Map(), // by hash
        toRemove = [];
        for (const sc of shapes)
            hashesInDom.set(sc.hash, false);
        let el = root.firstChild, elHash;
        while (el) {
            elHash = el.getAttribute('cgHash');
            // found a shape element that's here to stay
            if (hashesInDom.has(elHash))
                hashesInDom.set(elHash, true);
            // or remove it
            else
                toRemove.push(el);
            el = el.nextSibling;
        }
        // remove old shapes
        for (const el of toRemove)
            root.removeChild(el);
        // insert shapes that are not yet in dom
        for (const sc of shapes) {
            if (!hashesInDom.get(sc.hash))
                root.appendChild(renderShape(sc));
        }
    }

    function createElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }
    function renderSvg(state, svg, customSvg) {
        const d = state.drawable, curD = d.current, cur = curD && curD.mouseSq ? curD : undefined, arrowDests = new Map(), bounds = state.dom.bounds(), nonPieceAutoShapes = d.autoShapes.filter(autoShape => !autoShape.piece);
        for (const s of d.shapes.concat(nonPieceAutoShapes).concat(cur ? [cur] : [])) {
            if (s.dest)
                arrowDests.set(s.dest, (arrowDests.get(s.dest) || 0) + 1);
        }
        const shapes = d.shapes.concat(nonPieceAutoShapes).map((s) => {
            return {
                shape: s,
                current: false,
                hash: shapeHash(s, arrowDests, false, bounds),
            };
        });
        if (cur)
            shapes.push({
                shape: cur,
                current: true,
                hash: shapeHash(cur, arrowDests, true, bounds),
            });
        const fullHash = shapes.map(sc => sc.hash).join(';');
        if (fullHash === state.drawable.prevSvgHash)
            return;
        state.drawable.prevSvgHash = fullHash;
        /*
          -- DOM hierarchy --
          <svg class="cg-shapes">      (<= svg)
            <defs>
              ...(for brushes)...
            </defs>
            <g>
              ...(for arrows and circles)...
            </g>
          </svg>
          <svg class="cg-custom-svgs"> (<= customSvg)
            <g>
              ...(for custom svgs)...
            </g>
          </svg>
        */
        const defsEl = svg.querySelector('defs');
        const shapesEl = svg.querySelector('g');
        const customSvgsEl = customSvg.querySelector('g');
        syncDefs(d, shapes, defsEl);
        syncShapes(shapes.filter(s => !s.shape.customSvg), shapesEl, shape => renderShape$1(state, shape, d.brushes, arrowDests, bounds));
        syncShapes(shapes.filter(s => s.shape.customSvg), customSvgsEl, shape => renderShape$1(state, shape, d.brushes, arrowDests, bounds));
    }
    // append only. Don't try to update/remove.
    function syncDefs(d, shapes, defsEl) {
        const brushes = new Map();
        let brush;
        for (const s of shapes) {
            if (s.shape.dest) {
                brush = d.brushes[s.shape.brush];
                if (s.shape.modifiers)
                    brush = makeCustomBrush(brush, s.shape.modifiers);
                brushes.set(brush.key, brush);
            }
        }
        const keysInDom = new Set();
        let el = defsEl.firstChild;
        while (el) {
            keysInDom.add(el.getAttribute('cgKey'));
            el = el.nextSibling;
        }
        for (const [key, brush] of brushes.entries()) {
            if (!keysInDom.has(key))
                defsEl.appendChild(renderMarker(brush));
        }
    }
    function shapeHash({ orig, dest, brush, piece, modifiers, customSvg }, arrowDests, current, bounds) {
        return [
            bounds.width,
            bounds.height,
            current,
            orig,
            dest,
            brush,
            dest && (arrowDests.get(dest) || 0) > 1,
            piece && pieceHash(piece),
            modifiers && modifiersHash(modifiers),
            customSvg && customSvgHash(customSvg),
        ]
            .filter(x => x)
            .join(',');
    }
    function pieceHash(piece) {
        return [piece.color, piece.role, piece.scale].filter(x => x).join(',');
    }
    function modifiersHash(m) {
        return '' + (m.lineWidth || '');
    }
    function customSvgHash(s) {
        // Rolling hash with base 31 (cf. https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript)
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h + s.charCodeAt(i)) >>> 0;
        }
        return 'custom-' + h.toString();
    }
    function renderShape$1(state, { shape, current, hash }, brushes, arrowDests, bounds) {
        let el;
        const orig = orient(key2pos(shape.orig), state.orientation);
        if (shape.customSvg) {
            el = renderCustomSvg(shape.customSvg, orig, bounds);
        }
        else {
            if (shape.dest) {
                let brush = brushes[shape.brush];
                if (shape.modifiers)
                    brush = makeCustomBrush(brush, shape.modifiers);
                el = renderArrow(brush, orig, orient(key2pos(shape.dest), state.orientation), current, (arrowDests.get(shape.dest) || 0) > 1, bounds);
            }
            else
                el = renderCircle(brushes[shape.brush], orig, current, bounds);
        }
        el.setAttribute('cgHash', hash);
        return el;
    }
    function renderCustomSvg(customSvg, pos, bounds) {
        const [x, y] = pos2user(pos, bounds);
        // Translate to top-left of `orig` square
        const g = setAttributes(createElement('g'), { transform: `translate(${x},${y})` });
        // Give 100x100 coordinate system to the user for `orig` square
        const svg = setAttributes(createElement('svg'), { width: 1, height: 1, viewBox: '0 0 100 100' });
        g.appendChild(svg);
        svg.innerHTML = customSvg;
        return g;
    }
    function renderCircle(brush, pos, current, bounds) {
        const o = pos2user(pos, bounds), widths = circleWidth(), radius = (bounds.width + bounds.height) / (4 * Math.max(bounds.width, bounds.height));
        return setAttributes(createElement('circle'), {
            stroke: brush.color,
            'stroke-width': widths[current ? 0 : 1],
            fill: 'none',
            opacity: opacity(brush, current),
            cx: o[0],
            cy: o[1],
            r: radius - widths[1] / 2,
        });
    }
    function renderArrow(brush, orig, dest, current, shorten, bounds) {
        const m = arrowMargin(shorten && !current), a = pos2user(orig, bounds), b = pos2user(dest, bounds), dx = b[0] - a[0], dy = b[1] - a[1], angle = Math.atan2(dy, dx), xo = Math.cos(angle) * m, yo = Math.sin(angle) * m;
        return setAttributes(createElement('line'), {
            stroke: brush.color,
            'stroke-width': lineWidth(brush, current),
            'stroke-linecap': 'round',
            'marker-end': 'url(#arrowhead-' + brush.key + ')',
            opacity: opacity(brush, current),
            x1: a[0],
            y1: a[1],
            x2: b[0] - xo,
            y2: b[1] - yo,
        });
    }
    function renderMarker(brush) {
        const marker = setAttributes(createElement('marker'), {
            id: 'arrowhead-' + brush.key,
            orient: 'auto',
            markerWidth: 4,
            markerHeight: 8,
            refX: 2.05,
            refY: 2.01,
        });
        marker.appendChild(setAttributes(createElement('path'), {
            d: 'M0,0 V4 L3,2 Z',
            fill: brush.color,
        }));
        marker.setAttribute('cgKey', brush.key);
        return marker;
    }
    function setAttributes(el, attrs) {
        for (const key in attrs)
            el.setAttribute(key, attrs[key]);
        return el;
    }
    function orient(pos, color) {
        return color === 'white' ? pos : [7 - pos[0], 7 - pos[1]];
    }
    function makeCustomBrush(base, modifiers) {
        return {
            color: base.color,
            opacity: Math.round(base.opacity * 10) / 10,
            lineWidth: Math.round(modifiers.lineWidth || base.lineWidth),
            key: [base.key, modifiers.lineWidth].filter(x => x).join(''),
        };
    }
    function circleWidth() {
        return [3 / 64, 4 / 64];
    }
    function lineWidth(brush, current) {
        return ((brush.lineWidth || 10) * (current ? 0.85 : 1)) / 64;
    }
    function opacity(brush, current) {
        return (brush.opacity || 1) * (current ? 0.9 : 1);
    }
    function arrowMargin(shorten) {
        return (shorten ? 20 : 10) / 64;
    }
    function pos2user(pos, bounds) {
        const xScale = Math.min(1, bounds.width / bounds.height);
        const yScale = Math.min(1, bounds.height / bounds.width);
        return [(pos[0] - 3.5) * xScale, (3.5 - pos[1]) * yScale];
    }

    function renderWrap(element, s) {
        // .cg-wrap (element passed to Chessground)
        //   cg-container
        //     cg-board
        //     svg.cg-shapes
        //       defs
        //       g
        //     svg.cg-custom-svgs
        //       g
        //     cg-auto-pieces
        //     coords.ranks
        //     coords.files
        //     piece.ghost
        element.innerHTML = '';
        // ensure the cg-wrap class is set
        // so bounds calculation can use the CSS width/height values
        // add that class yourself to the element before calling chessground
        // for a slight performance improvement! (avoids recomputing style)
        element.classList.add('cg-wrap');
        for (const c of colors)
            element.classList.toggle('orientation-' + c, s.orientation === c);
        element.classList.toggle('manipulable', !s.viewOnly);
        const container = createEl('cg-container');
        element.appendChild(container);
        const board = createEl('cg-board');
        container.appendChild(board);
        let svg;
        let customSvg;
        let autoPieces;
        if (s.drawable.visible) {
            svg = setAttributes(createElement('svg'), {
                class: 'cg-shapes',
                viewBox: '-4 -4 8 8',
                preserveAspectRatio: 'xMidYMid slice',
            });
            svg.appendChild(createElement('defs'));
            svg.appendChild(createElement('g'));
            customSvg = setAttributes(createElement('svg'), {
                class: 'cg-custom-svgs',
                viewBox: '-3.5 -3.5 8 8',
                preserveAspectRatio: 'xMidYMid slice',
            });
            customSvg.appendChild(createElement('g'));
            autoPieces = createEl('cg-auto-pieces');
            container.appendChild(svg);
            container.appendChild(customSvg);
            container.appendChild(autoPieces);
        }
        if (s.coordinates) {
            const orientClass = s.orientation === 'black' ? ' black' : '';
            const ranksPositionClass = s.ranksPosition === 'left' ? ' left' : '';
            container.appendChild(renderCoords(ranks, 'ranks' + orientClass + ranksPositionClass));
            container.appendChild(renderCoords(files, 'files' + orientClass));
        }
        let ghost;
        if (s.draggable.showGhost) {
            ghost = createEl('piece', 'ghost');
            setVisible(ghost, false);
            container.appendChild(ghost);
        }
        return {
            board,
            container,
            wrap: element,
            ghost,
            svg,
            customSvg,
            autoPieces,
        };
    }
    function renderCoords(elems, className) {
        const el = createEl('coords', className);
        let f;
        for (const elem of elems) {
            f = createEl('coord');
            f.textContent = elem;
            el.appendChild(f);
        }
        return el;
    }

    function drop(s, e) {
        if (!s.dropmode.active)
            return;
        unsetPremove(s);
        unsetPredrop(s);
        const piece = s.dropmode.piece;
        if (piece) {
            s.pieces.set('a0', piece);
            const position = eventPosition(e);
            const dest = position && getKeyAtDomPos(position, whitePov(s), s.dom.bounds());
            if (dest)
                dropNewPiece(s, 'a0', dest);
        }
        s.dom.redraw();
    }

    function bindBoard(s, onResize) {
        const boardEl = s.dom.elements.board;
        if ('ResizeObserver' in window)
            new ResizeObserver(onResize).observe(s.dom.elements.wrap);
        if (s.viewOnly)
            return;
        // Cannot be passive, because we prevent touch scrolling and dragging of
        // selected elements.
        const onStart = startDragOrDraw(s);
        boardEl.addEventListener('touchstart', onStart, {
            passive: false,
        });
        boardEl.addEventListener('mousedown', onStart, {
            passive: false,
        });
        if (s.disableContextMenu || s.drawable.enabled) {
            boardEl.addEventListener('contextmenu', e => e.preventDefault());
        }
    }
    // returns the unbind function
    function bindDocument(s, onResize) {
        const unbinds = [];
        // Old versions of Edge and Safari do not support ResizeObserver. Send
        // chessground.resize if a user action has changed the bounds of the board.
        if (!('ResizeObserver' in window))
            unbinds.push(unbindable(document.body, 'chessground.resize', onResize));
        if (!s.viewOnly) {
            const onmove = dragOrDraw(s, move, move$1);
            const onend = dragOrDraw(s, end$1, end$2);
            for (const ev of ['touchmove', 'mousemove'])
                unbinds.push(unbindable(document, ev, onmove));
            for (const ev of ['touchend', 'mouseup'])
                unbinds.push(unbindable(document, ev, onend));
            const onScroll = () => s.dom.bounds.clear();
            unbinds.push(unbindable(document, 'scroll', onScroll, { capture: true, passive: true }));
            unbinds.push(unbindable(window, 'resize', onScroll, { passive: true }));
        }
        return () => unbinds.forEach(f => f());
    }
    function unbindable(el, eventName, callback, options) {
        el.addEventListener(eventName, callback, options);
        return () => el.removeEventListener(eventName, callback, options);
    }
    function startDragOrDraw(s) {
        return e => {
            if (s.draggable.current)
                cancel(s);
            else if (s.drawable.current)
                cancel$1(s);
            else if (e.shiftKey || isRightButton(e)) {
                if (s.drawable.enabled)
                    start$3(s, e);
            }
            else if (!s.viewOnly) {
                if (s.dropmode.active)
                    drop(s, e);
                else
                    start$2(s, e);
            }
        };
    }
    function dragOrDraw(s, withDrag, withDraw) {
        return e => {
            if (s.drawable.current) {
                if (s.drawable.enabled)
                    withDraw(s, e);
            }
            else if (!s.viewOnly)
                withDrag(s, e);
        };
    }

    // ported from https://github.com/veloce/lichobile/blob/master/src/js/chessground/view.js
    // in case of bugs, blame @veloce
    function render$1(s) {
        const asWhite = whitePov(s), posToTranslate$1 = posToTranslate(s.dom.bounds()), boardEl = s.dom.elements.board, pieces = s.pieces, curAnim = s.animation.current, anims = curAnim ? curAnim.plan.anims : new Map(), fadings = curAnim ? curAnim.plan.fadings : new Map(), curDrag = s.draggable.current, squares = computeSquareClasses(s), samePieces = new Set(), sameSquares = new Set(), movedPieces = new Map(), movedSquares = new Map(); // by class name
        let k, el, pieceAtKey, elPieceName, anim, fading, pMvdset, pMvd, sMvdset, sMvd;
        // walk over all board dom elements, apply animations and flag moved pieces
        el = boardEl.firstChild;
        while (el) {
            k = el.cgKey;
            if (isPieceNode(el)) {
                pieceAtKey = pieces.get(k);
                anim = anims.get(k);
                fading = fadings.get(k);
                elPieceName = el.cgPiece;
                // if piece not being dragged anymore, remove dragging style
                if (el.cgDragging && (!curDrag || curDrag.orig !== k)) {
                    el.classList.remove('dragging');
                    translate(el, posToTranslate$1(key2pos(k), asWhite));
                    el.cgDragging = false;
                }
                // remove fading class if it still remains
                if (!fading && el.cgFading) {
                    el.cgFading = false;
                    el.classList.remove('fading');
                }
                // there is now a piece at this dom key
                if (pieceAtKey) {
                    // continue animation if already animating and same piece
                    // (otherwise it could animate a captured piece)
                    if (anim && el.cgAnimating && elPieceName === pieceNameOf(pieceAtKey)) {
                        const pos = key2pos(k);
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                        el.classList.add('anim');
                        translate(el, posToTranslate$1(pos, asWhite));
                    }
                    else if (el.cgAnimating) {
                        el.cgAnimating = false;
                        el.classList.remove('anim');
                        translate(el, posToTranslate$1(key2pos(k), asWhite));
                        if (s.addPieceZIndex)
                            el.style.zIndex = posZIndex(key2pos(k), asWhite);
                    }
                    // same piece: flag as same
                    if (elPieceName === pieceNameOf(pieceAtKey) && (!fading || !el.cgFading)) {
                        samePieces.add(k);
                    }
                    // different piece: flag as moved unless it is a fading piece
                    else {
                        if (fading && elPieceName === pieceNameOf(fading)) {
                            el.classList.add('fading');
                            el.cgFading = true;
                        }
                        else {
                            appendValue(movedPieces, elPieceName, el);
                        }
                    }
                }
                // no piece: flag as moved
                else {
                    appendValue(movedPieces, elPieceName, el);
                }
            }
            else if (isSquareNode(el)) {
                const cn = el.className;
                if (squares.get(k) === cn)
                    sameSquares.add(k);
                else
                    appendValue(movedSquares, cn, el);
            }
            el = el.nextSibling;
        }
        // walk over all squares in current set, apply dom changes to moved squares
        // or append new squares
        for (const [sk, className] of squares) {
            if (!sameSquares.has(sk)) {
                sMvdset = movedSquares.get(className);
                sMvd = sMvdset && sMvdset.pop();
                const translation = posToTranslate$1(key2pos(sk), asWhite);
                if (sMvd) {
                    sMvd.cgKey = sk;
                    translate(sMvd, translation);
                }
                else {
                    const squareNode = createEl('square', className);
                    squareNode.cgKey = sk;
                    translate(squareNode, translation);
                    boardEl.insertBefore(squareNode, boardEl.firstChild);
                }
            }
        }
        // walk over all pieces in current set, apply dom changes to moved pieces
        // or append new pieces
        for (const [k, p] of pieces) {
            anim = anims.get(k);
            if (!samePieces.has(k)) {
                pMvdset = movedPieces.get(pieceNameOf(p));
                pMvd = pMvdset && pMvdset.pop();
                // a same piece was moved
                if (pMvd) {
                    // apply dom changes
                    pMvd.cgKey = k;
                    if (pMvd.cgFading) {
                        pMvd.classList.remove('fading');
                        pMvd.cgFading = false;
                    }
                    const pos = key2pos(k);
                    if (s.addPieceZIndex)
                        pMvd.style.zIndex = posZIndex(pos, asWhite);
                    if (anim) {
                        pMvd.cgAnimating = true;
                        pMvd.classList.add('anim');
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pMvd, posToTranslate$1(pos, asWhite));
                }
                // no piece in moved obj: insert the new piece
                // assumes the new piece is not being dragged
                else {
                    const pieceName = pieceNameOf(p), pieceNode = createEl('piece', pieceName), pos = key2pos(k);
                    pieceNode.cgPiece = pieceName;
                    pieceNode.cgKey = k;
                    if (anim) {
                        pieceNode.cgAnimating = true;
                        pos[0] += anim[2];
                        pos[1] += anim[3];
                    }
                    translate(pieceNode, posToTranslate$1(pos, asWhite));
                    if (s.addPieceZIndex)
                        pieceNode.style.zIndex = posZIndex(pos, asWhite);
                    boardEl.appendChild(pieceNode);
                }
            }
        }
        // remove any element that remains in the moved sets
        for (const nodes of movedPieces.values())
            removeNodes(s, nodes);
        for (const nodes of movedSquares.values())
            removeNodes(s, nodes);
    }
    function renderResized$1(s) {
        const asWhite = whitePov(s), posToTranslate$1 = posToTranslate(s.dom.bounds());
        let el = s.dom.elements.board.firstChild;
        while (el) {
            if ((isPieceNode(el) && !el.cgAnimating) || isSquareNode(el)) {
                translate(el, posToTranslate$1(key2pos(el.cgKey), asWhite));
            }
            el = el.nextSibling;
        }
    }
    function updateBounds(s) {
        const bounds = s.dom.elements.wrap.getBoundingClientRect();
        const container = s.dom.elements.container;
        const ratio = bounds.height / bounds.width;
        const width = (Math.floor((bounds.width * window.devicePixelRatio) / 8) * 8) / window.devicePixelRatio;
        const height = width * ratio;
        container.style.width = width + 'px';
        container.style.height = height + 'px';
        s.dom.bounds.clear();
        if (s.addDimensionsCssVars) {
            document.documentElement.style.setProperty('--cg-width', width + 'px');
            document.documentElement.style.setProperty('--cg-height', height + 'px');
        }
    }
    function isPieceNode(el) {
        return el.tagName === 'PIECE';
    }
    function isSquareNode(el) {
        return el.tagName === 'SQUARE';
    }
    function removeNodes(s, nodes) {
        for (const node of nodes)
            s.dom.elements.board.removeChild(node);
    }
    function posZIndex(pos, asWhite) {
        const minZ = 3;
        const rank = pos[1];
        const z = asWhite ? minZ + 7 - rank : minZ + rank;
        return `${z}`;
    }
    function pieceNameOf(piece) {
        return `${piece.color} ${piece.role}`;
    }
    function computeSquareClasses(s) {
        var _a;
        const squares = new Map();
        if (s.lastMove && s.highlight.lastMove)
            for (const k of s.lastMove) {
                addSquare(squares, k, 'last-move');
            }
        if (s.check && s.highlight.check)
            addSquare(squares, s.check, 'check');
        if (s.selected) {
            addSquare(squares, s.selected, 'selected');
            if (s.movable.showDests) {
                const dests = (_a = s.movable.dests) === null || _a === void 0 ? void 0 : _a.get(s.selected);
                if (dests)
                    for (const k of dests) {
                        addSquare(squares, k, 'move-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
                const pDests = s.premovable.dests;
                if (pDests)
                    for (const k of pDests) {
                        addSquare(squares, k, 'premove-dest' + (s.pieces.has(k) ? ' oc' : ''));
                    }
            }
        }
        const premove = s.premovable.current;
        if (premove)
            for (const k of premove)
                addSquare(squares, k, 'current-premove');
        else if (s.predroppable.current)
            addSquare(squares, s.predroppable.current.key, 'current-premove');
        const o = s.exploding;
        if (o)
            for (const k of o.keys)
                addSquare(squares, k, 'exploding' + o.stage);
        return squares;
    }
    function addSquare(squares, key, klass) {
        const classes = squares.get(key);
        if (classes)
            squares.set(key, `${classes} ${klass}`);
        else
            squares.set(key, klass);
    }
    function appendValue(map, key, value) {
        const arr = map.get(key);
        if (arr)
            arr.push(value);
        else
            map.set(key, [value]);
    }

    function render(state, autoPieceEl) {
        const autoPieces = state.drawable.autoShapes.filter(autoShape => autoShape.piece);
        const autoPieceShapes = autoPieces.map((s) => {
            return {
                shape: s,
                hash: hash$2(s),
                current: false,
            };
        });
        syncShapes(autoPieceShapes, autoPieceEl, shape => renderShape(state, shape, state.dom.bounds()));
    }
    function renderResized(state) {
        var _a;
        const asWhite = whitePov(state), posToTranslate$1 = posToTranslate(state.dom.bounds());
        let el = (_a = state.dom.elements.autoPieces) === null || _a === void 0 ? void 0 : _a.firstChild;
        while (el) {
            translateAndScale(el, posToTranslate$1(key2pos(el.cgKey), asWhite), el.cgScale);
            el = el.nextSibling;
        }
    }
    function renderShape(state, { shape, hash }, bounds) {
        var _a, _b, _c;
        const orig = shape.orig;
        const role = (_a = shape.piece) === null || _a === void 0 ? void 0 : _a.role;
        const color = (_b = shape.piece) === null || _b === void 0 ? void 0 : _b.color;
        const scale = (_c = shape.piece) === null || _c === void 0 ? void 0 : _c.scale;
        const pieceEl = createEl('piece', `${role} ${color}`);
        pieceEl.setAttribute('cgHash', hash);
        pieceEl.cgKey = orig;
        pieceEl.cgScale = scale;
        translateAndScale(pieceEl, posToTranslate(bounds)(key2pos(orig), whitePov(state)), scale);
        return pieceEl;
    }
    function hash$2(autoPiece) {
        var _a, _b, _c;
        return [autoPiece.orig, (_a = autoPiece.piece) === null || _a === void 0 ? void 0 : _a.role, (_b = autoPiece.piece) === null || _b === void 0 ? void 0 : _b.color, (_c = autoPiece.piece) === null || _c === void 0 ? void 0 : _c.scale].join(',');
    }

    function Chessground(element, config) {
        const maybeState = defaults();
        configure(maybeState, config || {});
        function redrawAll() {
            const prevUnbind = 'dom' in maybeState ? maybeState.dom.unbind : undefined;
            // compute bounds from existing board element if possible
            // this allows non-square boards from CSS to be handled (for 3D)
            const elements = renderWrap(element, maybeState), bounds = memo(() => elements.board.getBoundingClientRect()), redrawNow = (skipSvg) => {
                render$1(state);
                if (elements.autoPieces)
                    render(state, elements.autoPieces);
                if (!skipSvg && elements.svg)
                    renderSvg(state, elements.svg, elements.customSvg);
            }, onResize = () => {
                updateBounds(state);
                renderResized$1(state);
                if (elements.autoPieces)
                    renderResized(state);
            };
            const state = maybeState;
            state.dom = {
                elements,
                bounds,
                redraw: debounceRedraw(redrawNow),
                redrawNow,
                unbind: prevUnbind,
            };
            state.drawable.prevSvgHash = '';
            updateBounds(state);
            redrawNow(false);
            bindBoard(state, onResize);
            if (!prevUnbind)
                state.dom.unbind = bindDocument(state, onResize);
            state.events.insert && state.events.insert(elements);
            return state;
        }
        return start$1(redrawAll(), redrawAll);
    }
    function debounceRedraw(redrawNow) {
        let redrawing = false;
        return () => {
            if (redrawing)
                return;
            redrawing = true;
            requestAnimationFrame(() => {
                redrawNow();
                redrawing = false;
            });
        };
    }

    const renderBoard = (ctrl) => h('div.game-page__board', h('div.cg-wrap', {
        hook: {
            insert(vnode) {
                ctrl.setGround(Chessground(vnode.elm, ctrl.chessgroundConfig()));
            },
        },
    }, 'loading...'));
    const renderPlayer = (ctrl, color, clock, name, title, rating, aiLevel) => {
        return h('div.game-page__player', {
            class: {
                turn: ctrl.chess.turn == color,
            },
        }, [
            h('div.game-page__player__user', [
                title && h('span.game-page__player__user__title.display-5', title),
                h('span.game-page__player__user__name.display-5', aiLevel ? `Stockfish level ${aiLevel}` : name || 'Anon'),
                h('span.game-page__player__user__rating', rating || ''),
            ]),
            h('div.game-page__player__clock.display-6', clock),
        ]);
    };

    const renderGame = ctrl => _ => [
        h(`div.game-page.game-page--${ctrl.game.id}`, {
            hook: {
                destroy: ctrl.onUnmount,
            },
        }, [
            renderGamePlayer(ctrl, opposite(ctrl.pov)),
            renderBoard(ctrl),
            renderGamePlayer(ctrl, ctrl.pov),
            ctrl.playing() ? renderButtons(ctrl) : renderState(ctrl),
        ]),
    ];
    const renderButtons = (ctrl) => h('div.btn-group.mt-4', [
        h('button.btn.btn-secondary', {
            attrs: { type: 'button', disabled: !ctrl.playing() },
            on: {
                click() {
                    if (confirm('Confirm?'))
                        ctrl.resign();
                },
            },
        }, ctrl.chess.fullmoves > 1 ? 'Resign' : 'Abort'),
    ]);
    const renderState = (ctrl) => h('div.game-page__state', ctrl.game.state.status);
    const renderGamePlayer = (ctrl, color) => {
        const p = ctrl.game[color];
        const clock = clockContent(ctrl.timeOf(color), color == ctrl.chess.turn && ctrl.chess.fullmoves > 1 && ctrl.playing() ? ctrl.lastUpdateAt - Date.now() : 0);
        return renderPlayer(ctrl, color, clock, p.name, p.title, p.rating, p.aiLevel);
    };

    const positions_multiset = [
        { 'fen': 'k1b1n1rn/ppqpppp1/1pp2p1b/p4pp1/2B5/1R5P/1PBPPQPP/1R2BK1R w - - 0 1', 'eval': 12 },
        { 'fen': '2kb2br/pppp1ppn/p1nnp2r/7r/P1B1P1PQ/P2P1Q1P/P1PPPPP1/N2BK3 w - - 0 1', 'eval': 48 },
        { 'fen': 'k1q1q3/ppppp1p1/1np1n1r1/1p1p4/P3P2P/1Q1PP1P1/P1PPPP1P/QNB1K2N w - - 0 1', 'eval': -56 },
        { 'fen': 'k2q2qr/pppp1pp1/2p1pp2/1p1p2pn/1PB1PP1P/P3PQN1/1P1PPPP1/K1B1R2R w - - 0 1', 'eval': 80 },
        { 'fen': '1krbr3/pbppppp1/1pppn2p/2b1r1p1/P1P3PB/P1PB1P1P/PPPPR1NP/1R2BKR1 w - - 0 1', 'eval': 9 },
        { 'fen': 'k2rnq1r/pppp1p1p/3pp3/2n1r3/P5BP/2B2P1P/PPPP1P2/R1QRR2K w - - 0 1', 'eval': -29 },
        { 'fen': '2r1kbbb/pp1ppp1p/p1p3rr/2p1p2r/BP1PP3/P3Q1PB/QPPPP1P1/R3K3 w - - 0 1', 'eval': 14 },
        { 'fen': 'r1r1k1rn/rp1ppppp/1r1ppppp/8/7N/4NP2/PPRPBNPP/N2K2NQ w - - 0 1', 'eval': 16 },
        { 'fen': 'nrk2r2/ppbpr1pp/b1pb4/6r1/2P5/P1P3B1/1NPPPPPP/R1QR1R1K w - - 0 1', 'eval': 31 },
        { 'fen': 'kq1bb1b1/pp1pbppr/2pp2bp/8/P7/Q4NPP/PP1PBPPP/1R1NKNB1 w - - 0 1', 'eval': -21 },
        { 'fen': 'r1k1rnr1/ppnrpp1p/4bbp1/8/6P1/2PP1RP1/PPPPP2B/1NRQR2K w - - 0 1', 'eval': -115 },
        { 'fen': 'q1qk2n1/ppbbp1pp/4np2/4p3/2P4P/PP1P1NQP/1BPPPPPP/2QKN3 w - - 0 1', 'eval': 46 },
        { 'fen': '3qkn2/pqppn1pp/1pb2p1b/8/2P3P1/2R1PQ2/PPBBPPPP/1KR1R3 w - - 0 1', 'eval': -56 },
        { 'fen': '3n2kb/ppppp1p1/np3bpb/q6r/P3RP2/PP1PBPP1/1PPPPPB1/1RB1N1KR w - - 0 1', 'eval': 12 },
        { 'fen': 'b1r2kn1/rppprppp/p3bb2/4p1b1/B2R4/RR2P2N/1P1P1PPP/1Q1K2N1 w - - 0 1', 'eval': -75 },
        { 'fen': 'rn4k1/pppp1bqp/2b1npp1/b5p1/3R2B1/N2P2N1/PPBQPP1P/K3N1B1 w - - 0 1', 'eval': 49 },
        { 'fen': '6rk/rpbppp1p/qnp2pb1/1p2p1p1/2P5/2P3PB/1PPP1NPP/2QQN1NK w - - 0 1', 'eval': -59 },
        { 'fen': '1b2k1bq/nnppp1pp/1p1p3r/4r3/PPP2R2/BRP3B1/PPP1PPPP/1NR1R1K1 w - - 0 1', 'eval': -110 },
        { 'fen': 'n2n1nk1/ppppqpr1/1n1p1pp1/7b/1R6/1P3R1B/PQ1PPP1P/RKB3N1 w - - 0 1', 'eval': 33 },
        { 'fen': '2rn1rk1/ppppp1pr/3nnpp1/1b3n2/1R1B3N/4P3/P2PRPPP/Q2KN2R w - - 0 1', 'eval': -31 },
        { 'fen': 'b3qb1k/p1ppppp1/1prp1p1b/1pp3bp/1P4B1/1R1NPPR1/PPPP1P2/2BQ1N1K w - - 0 1', 'eval': 5 },
        { 'fen': 'nrbq1k1r/ppp2ppp/pp1p4/2p2b2/P2P3P/1P1RP1NP/1PPPP1PP/KR2BBRB w - - 0 1', 'eval': 48 },
        { 'fen': 'q2rk2r/pppppppp/1r2pb2/3ppp2/1PBPQ3/NPP3P1/P1PPPPPP/2NQK3 w - - 0 1', 'eval': -34 },
        { 'fen': '3qq1kr/ppp1p2p/p1n1p1pp/1p1p2p1/1PNP2P1/2N1P2R/PP1PPP2/2BNRRKB w - - 0 1', 'eval': 82 },
        { 'fen': '1rrkr1b1/pppppp1p/1n1pp3/3bpb1p/PN2BRQ1/1BP2PP1/PPPP2PB/KN6 w - - 0 1', 'eval': -45 },
        { 'fen': '1q1krb1r/pp1pp2p/2n2p1b/2p4b/4P2P/1P1PQ2P/PPPPP1PN/R2R1BNK w - - 0 1', 'eval': -38 },
        { 'fen': '1n2r1kb/pppppp1p/p1b1n1qp/3ppp2/P2R4/2P3Q1/PPPPP2P/1BKB1BBR w - - 0 1', 'eval': -55 },
        { 'fen': 'nk2bb2/pprpppb1/p1pp1p1r/4p1pr/3P1P2/4NP1P/1PPPP1NP/2NKRQNB w - - 0 1', 'eval': 59 },
        { 'fen': '1rq4k/1ppppppp/p1qpp2b/5p1p/N2P3P/P1PP2P1/NPPP1PPP/NKQ1Q3 w - - 0 1', 'eval': -76 },
        { 'fen': '1qk5/pp1ppppr/rr1p1n2/1pppp2p/2R5/1P3P1N/P1BPPPRP/NKBRR3 w - - 0 1', 'eval': 50 },
        { 'fen': '3bkr2/p1p1pppp/2b1q2p/5rbb/5P1P/P1P1PRBN/P2PPPP1/QKQ5 w - - 0 1', 'eval': -107 },
        { 'fen': '1qk1r1q1/pppp1p2/p2p1np1/2pp2pp/PB1PBN2/2Q2P1P/PPB1PNPP/1R1K4 w - - 0 1', 'eval': 108 },
        { 'fen': '1k2rrb1/prpqp1pp/2pp3n/5p2/3P2P1/4PP2/PPPPRPPP/1B1KBQRN w - - 0 1', 'eval': -46 },
        { 'fen': 'n1n4k/ppr1pppp/3p1n2/1r1n3q/1P3R2/3P1PP1/PPPPRR1P/1RN1RN1K w - - 0 1', 'eval': 100 },
        { 'fen': '1qrrk3/1ppp1ppp/1pp1r2n/pp3p1p/3P1PPR/P2PQ1P1/1PPP1PNP/BRK4N w - - 0 1', 'eval': 27 },
        { 'fen': 'nb1r2k1/pp1qpp1p/1p1q2pp/p7/P1PPP3/1P1PPBR1/P1P1PNPP/B3RKRN w - - 0 1', 'eval': 29 },
        { 'fen': '4kq1b/pbppp1pp/pp3rqp/8/1PPP3B/N5P1/PQPPP1PR/R2R2K1 w - - 0 1', 'eval': 70 },
        { 'fen': 'rqk4r/ppp1pprp/p1npp1p1/3pp3/PP1PNN2/1RP1PP2/PP1R1PPP/3RRKN1 w - - 0 1', 'eval': -21 },
        { 'fen': '3qkqbb/1pp1pp1p/6pp/r1p1p3/P3P3/2PPPRP1/PPP1NPRP/B3NQK1 w - - 0 1', 'eval': -45 },
        { 'fen': '1nrnnk1r/1pppp1pb/r1r2p2/8/2RB4/NN1P4/1PR1PPPP/KR2Q3 w - - 0 1', 'eval': -68 },
        { 'fen': '1k1q1n2/pp1ppn1p/2r2p1p/p4r1r/1PP2RR1/PRP2PP1/PPRPP1PP/4RB1K w - - 0 1', 'eval': 86 },
        { 'fen': 'r5kb/p1pppppn/pnpn2q1/1p1p1pp1/P2P4/P1BBP2Q/PNPP1P1P/1BRN3K w - - 0 1', 'eval': 8 },
        { 'fen': 'n2b2k1/p1p1prpp/3pq3/bp1nr3/1R1P4/1P1NPP2/PRPP1PP1/BRB1K1BB w - - 0 1', 'eval': -185 },
        { 'fen': 'kr2n1q1/ppr1pp1p/pppr1pp1/pp6/2B5/1Q2P3/PPPN2PP/RRN2KR1 w - - 0 1', 'eval': 30 },
        { 'fen': '1br2k1r/1qp1pppp/1ppppppr/2p5/P3P1R1/PBN3P1/RPPPPP2/2RKBB1N w - - 0 1', 'eval': -6 },
        { 'fen': 'k1nn4/1ppppppp/pbn1qpp1/3r1pp1/5Q2/1NP2B2/P1PP1NPP/1N1K1NRN w - - 0 1', 'eval': 23 },
        { 'fen': '1b1k2bb/ppr1ppp1/2np2rq/2p5/7P/PN3P2/2PPPPBP/B1N1K1QQ w - - 0 1', 'eval': -84 },
        { 'fen': 'r3r1kq/pprpppp1/2p2pbp/p2pp3/8/1NNR3P/QPPP2PP/K2N1Q2 w - - 0 1', 'eval': -72 },
        { 'fen': 'nr1k1n2/pp2rppp/1rrp1p1p/1p1np3/1NR1N3/4P1PN/1PPP1P1P/KRBR3R w - - 0 1', 'eval': 7 },
        { 'fen': '5kb1/pppp1ppq/p1qpp1rn/8/P1PP2R1/1PR1PPR1/P1PP1PPP/1KR2BR1 w - - 0 1', 'eval': -24 },
        { 'fen': 'q1k1q3/pppppnnp/1p4pp/2p1b1p1/4P2R/1Q1NPPP1/PPP1P1PB/NBN4K w - - 0 1', 'eval': -42 },
        { 'fen': '1bk2br1/pp1ppb1p/r3bp1r/6r1/5P2/1B2QP2/NPPQPPPP/B5KN w - - 0 1', 'eval': -191 },
        { 'fen': '1rq1k3/ppppppp1/1brpp2r/p2p3p/R1B1R3/Q3PN2/2PPPBPP/K3R3 w - - 0 1', 'eval': -9 },
        { 'fen': 'k2rn3/prpp1ppb/npppp3/2p3q1/8/4NP2/1PRPPQPP/BBNK1N1B w - - 0 1', 'eval': 37 },
        { 'fen': '2nqkr2/pppp2pp/4pb1q/3p1p2/4QR2/3P4/P1PP1QPP/3B1BKB w - - 0 1', 'eval': -77 },
        { 'fen': 'q1r2bk1/pppp1pp1/ppq1p3/pp3p2/1QPP1P2/5P1P/PP1PB1PP/1Q2KB1R w - - 0 1', 'eval': -30 },
        { 'fen': 'b3r1qk/rppp1ppp/pp2ppp1/2rp4/P4P1N/1P1N1PR1/1PP1P1PP/1RKRR2R w - - 0 1', 'eval': -57 },
        { 'fen': 'q1k1r2n/pq1pppp1/1pp2b2/4pp2/1R5P/RBN1R1P1/1PP1PPRP/1B2K1B1 w - - 0 1', 'eval': 76 },
        { 'fen': 'q1nb1nk1/pppp1pp1/2ppp2p/1qp5/1BR2Q2/1R5P/BP2PPPP/4RN1K w - - 0 1', 'eval': -65 },
        { 'fen': '2kq2b1/pprppbpb/7p/bp1r4/5PN1/P1B4N/QPPPPPP1/NRK3R1 w - - 0 1', 'eval': 55 },
        { 'fen': 'r2bq1k1/1ppnnppp/p4nr1/p7/P1R3R1/P1R2NB1/1P1PPPP1/3RNKB1 w - - 0 1', 'eval': -55 },
        { 'fen': '1kq1r1r1/p1p2ppp/p2pn2n/n3b3/3NN1B1/1P1PP2P/1PPRPP1P/BK1RNR2 w - - 0 1', 'eval': 0 },
        { 'fen': '1r4kn/qppppp1p/np1r2p1/1ppb4/4P3/1B1R2P1/P1BPPPRP/K1R2RNB w - - 0 1', 'eval': -50 },
        { 'fen': '1r3nk1/p1qppppp/1pp4p/p1ppq3/6Q1/3B2P1/PPRPP1P1/N1Q1K1B1 w - - 0 1', 'eval': -66 },
        { 'fen': '2nkb1n1/rpprppqp/5pp1/4n3/2Q1B3/2P2PPP/PP1PPPP1/1R3KNQ w - - 0 1', 'eval': -32 },
        { 'fen': 'nk4b1/ppp1qppp/pbbp1p2/1ppr1p2/1P6/PNP3P1/RNPPPP1P/2RK1QR1 w - - 0 1', 'eval': 57 },
        { 'fen': 'nk2r2q/pppppnpp/1pbbp1p1/3p1p2/3P2N1/2P5/PPPPPNQP/B2N1KQ1 w - - 0 1', 'eval': -70 },
        { 'fen': '3n2kn/q1pppppp/bp2n1r1/r7/PBP2B2/P2B2N1/PRPP1PPP/Q1B2K2 w - - 0 1', 'eval': 21 },
        { 'fen': '3b1rkn/pprppb1p/2n3p1/b4prp/P7/3P2PQ/PPQPP1PB/1B1NK1N1 w - - 0 1', 'eval': 1 },
        { 'fen': 'q1k1bq2/ppp1pbpp/1p3p1p/1b2p1p1/1P4PP/1PP1QP2/P1PQPPPP/N2K1NN1 w - - 0 1', 'eval': 113 },
        { 'fen': '1k2q1q1/pppp1ppp/2brp2p/2p2pp1/N6R/1P3N2/Q1PPP1PP/K2QN3 w - - 0 1', 'eval': 55 },
        { 'fen': '1n1qqk2/ppp1rpp1/p2pp1n1/4p3/1Q6/P2P2NB/P2PPPPP/KQ1N2B1 w - - 0 1', 'eval': 66 },
        { 'fen': 'qbr3rk/pp1p1ppp/p1p2r1p/2p1p1p1/1P2PP1P/2RP1PP1/PPPPR1P1/1RBKRR2 w - - 0 1', 'eval': 46 },
        { 'fen': '1b1rkn2/ppnpppq1/2pb4/4p1r1/8/1B4P1/PPP2PQP/NQN1R2K w - - 0 1', 'eval': -65 },
        { 'fen': 'r1n2b1k/npppppp1/p2pbp1p/pr1r4/1R1P3P/P1R4N/RPP1PPPP/3R1KBR w - - 0 1', 'eval': 15 },
        { 'fen': '1bk1nb2/pp1pprpp/2r2p2/1bq5/4RQ1N/2P5/P1BPPRPP/4NRK1 w - - 0 1', 'eval': -1 },
        { 'fen': '1qb2k2/ppppp3/1p1rrppp/2prp1p1/3B3P/PR2PP2/PPPPPPPP/K2RRR1R w - - 0 1', 'eval': 58 },
        { 'fen': 'r1r1brkn/p1ppppp1/1p2p3/1r1npp2/1R2N2P/1RR1P1P1/RPPP1PPP/4K1NR w - - 0 1', 'eval': -76 },
        { 'fen': '4bnkr/1pqpbppp/1pp5/3b2r1/B2P1R1P/1NPQNN2/PPPPPP2/2BK4 w - - 0 1', 'eval': -70 },
        { 'fen': 'b1k4q/brbppppp/2b1pp1n/3p4/P4Q2/2PPP1P1/PPPBPPPP/1N1QB2K w - - 0 1', 'eval': -53 },
        { 'fen': 'k1q2b2/pppbppnp/3pn1p1/2r2b2/2P1RN2/1B2P1PP/PPP1PPPP/1BK1Q1R1 w - - 0 1', 'eval': -86 },
        { 'fen': '4k2b/b1ppppp1/1pbbp1nq/r3p3/1B1Q4/4P3/PRRP1PPP/1K2B1NR w - - 0 1', 'eval': 95 },
        { 'fen': 'b3n1rk/ppp2pbp/r1n1rp2/3pp1n1/4N1P1/RP2P2R/PRPPPP1P/1RR1N2K w - - 0 1', 'eval': -32 },
        { 'fen': '3nqr1k/pppp1ppp/p2rp1p1/1ppr4/1B4QN/N1B1P3/P1PPRP1P/3NB1K1 w - - 0 1', 'eval': -64 },
        { 'fen': '2bn1k2/p1rpppbp/6p1/p1pppq1r/2RR4/5PP1/PPPPBPPP/NR2KQ2 w - - 0 1', 'eval': 49 },
        { 'fen': '1kn2r1b/3ppppp/1pp1rrr1/1r5p/1P1P3P/1P1P2PP/RPPPP2P/BRRK1R1R w - - 0 1', 'eval': -154 },
        { 'fen': '4b1kr/1rpppp1p/pqpp2pr/2pp3p/1P1PN3/1P1PPPRP/PPP2PPR/RR1R3K w - - 0 1', 'eval': -34 },
        { 'fen': '4kqq1/npppppp1/1p2p3/p1rb4/3R2N1/RQ1R2P1/P1PPBP1P/1KN5 w - - 0 1', 'eval': -27 },
        { 'fen': '3k3q/1ppp1qpp/p2p1b2/p1pn1r2/6R1/1P1NP1P1/BP1PP1PP/3RBNKQ w - - 0 1', 'eval': -63 },
        { 'fen': 'k4r2/1ppppp1p/1q2n2p/r1ppprpp/PPP2B2/P1R1Q1PP/PPPP1P1R/1N3K1N w - - 0 1', 'eval': -95 },
        { 'fen': 'k2n3r/ppp1pppp/1p1prbrp/b1p3n1/2P1P3/PRB1PR1P/PPPPPPP1/1R3KRR w - - 0 1', 'eval': -65 },
        { 'fen': '1r2kb1n/bqppp1pp/1prn1p2/8/RP5P/P1QB4/PPPPP1RP/1R2BK2 w - - 0 1', 'eval': 98 },
        { 'fen': 'nbrn2rk/pp1npp1p/b2p1p2/r5p1/NPN5/4P1P1/PPPR1PPB/1RKN1Q2 w - - 0 1', 'eval': 67 },
        { 'fen': '1qrbkb2/1ppppp1p/1p1nppb1/1p1pp3/2P1PNR1/2PNPP2/PPP1P1PP/R2NK2Q w - - 0 1', 'eval': 56 },
        { 'fen': '5bk1/1pppbp1p/pp2qnp1/p3q1pp/1R2B3/QN4P1/1BPPPPNP/1N3N1K w - - 0 1', 'eval': -92 },
        { 'fen': 'rnb1k2q/pp2pppb/1pbpb2p/8/4P1P1/RP1PRP2/PPPP1PBP/BRN1RK2 w - - 0 1', 'eval': 87 },
        { 'fen': '2kb1rq1/pppp2p1/r2ppr1n/5p2/6BN/P2QPPNP/PP1NBPPP/1K3R2 w - - 0 1', 'eval': -40 },
        { 'fen': 'qkrrnr2/ppp1ppp1/1pppp3/1p5p/R7/PR1B1P2/PPP1NPP1/B1R1BRK1 w - - 0 1', 'eval': 54 },
        { 'fen': 'nrkr1br1/pp1pppp1/3b1ppr/1p1p4/2PP1R1P/2P3PP/PPBP1PPP/1RKBRBB1 w - - 0 1', 'eval': 34 },
        { 'fen': '1q1bn1bk/ppppp1pp/1p2pp2/pnr1p3/PP2PN2/1PR1P1P1/1PPPRPPP/RR2R2K w - - 0 1', 'eval': 35 },
        { 'fen': '1bq4k/rp1pprpp/1pp2ppr/1pp4p/Q5P1/PP1B1QP1/PPPPP1P1/2BKR3 w - - 0 1', 'eval': 32 },
        { 'fen': '2n3qk/p1pr1ppp/1p1pppp1/4ppq1/6QR/1P1NN3/P2P1PPP/R2KRB2 w - - 0 1', 'eval': 0 },
        { 'fen': '2kn1r2/p1pppprq/2np3p/pnp2p2/1PPPRR1P/NP4P1/PPPP2PP/2RRR2K w - - 0 1', 'eval': 42 },
        { 'fen': 'b1nn3k/pppq1ppp/1b1rpp1p/3p1pp1/2P2RP1/1NBR3P/PPPBP1PN/4Q2K w - - 0 1', 'eval': 18 },
        { 'fen': 'br3kb1/rpp1rppp/3prppb/3p2p1/N7/1P1P1P2/PPP1PP1N/QB2Q1BK w - - 0 1', 'eval': -78 },
        { 'fen': 'nknbn3/ppp2ppq/r1p3p1/3n3p/3B2N1/2R4P/QPP1PPPR/1R2K2N w - - 0 1', 'eval': 12 },
        { 'fen': 'b2q2rk/ppppp1pp/2p1rppr/p5p1/1P2PP2/1P1PR1PP/P1PPPR1P/K2NRNBN w - - 0 1', 'eval': -70 },
        { 'fen': '3r1k1b/ppp1pp1p/2bp4/3r1pqr/1N1N1R2/Q6P/P1P2PPP/N4KQ1 w - - 0 1', 'eval': 20 },
        { 'fen': 'q3qk1n/1p1ppppp/n1pp2p1/1np3p1/2N3P1/1QPP2PP/1PPPPPPB/1B1K1RR1 w - - 0 1', 'eval': -39 },
        { 'fen': '1k6/p1pqpppq/2nrpp1p/p2p1pp1/RP1P1PP1/2PPQB2/P2PPPRP/2KB2B1 w - - 0 1', 'eval': 45 },
        { 'fen': '5qk1/2pppppp/pb2r2n/5prr/6P1/P3PPQ1/PNRPP1PP/1R1B1R1K w - - 0 1', 'eval': 82 },
        { 'fen': '1rkrn3/pqpppppp/4nn1p/3p3p/2N3P1/P1P1P1R1/1PNPPPP1/1BNRB1KR w - - 0 1', 'eval': 7 },
        { 'fen': 'nrrq2k1/pppppprp/1p2p3/3p1pp1/2R2P1P/1P1B3P/NPPRP1PP/1N1KB1RB w - - 0 1', 'eval': -65 },
        { 'fen': '3r2rk/1ppp2pp/p2rb1bq/6pp/1PN1P1BP/1PP2RP1/1PPPPQ1P/N1R4K w - - 0 1', 'eval': -105 },
        { 'fen': 'q1b1rk2/bpppnppn/1pb5/5p1p/RNR5/P4B2/1PBPP1PP/1R1K3Q w - - 0 1', 'eval': 44 },
        { 'fen': '2qnn2k/pp1pp1pp/2pp1rnp/p3pp1n/RQ2PPP1/PP2P3/BP1PP1PP/3BKNR1 w - - 0 1', 'eval': 57 },
        { 'fen': '2brkb2/pppp3p/3r1bpn/4q2p/P1P4P/3P3P/PP2PPP1/K1QBRNQ1 w - - 0 1', 'eval': -4 },
        { 'fen': '1nknb3/ppppppp1/qr2ppp1/bp3p2/N1P4P/R5PR/P1PPPPRP/QK4B1 w - - 0 1', 'eval': -86 },
        { 'fen': '4qqkr/pp1ppppb/2ppp3/1p2pp2/6Q1/1NP5/P2PPPQP/NB2RK2 w - - 0 1', 'eval': -52 },
        { 'fen': 'nk1n2r1/p1pppnp1/1p2pqpp/2p2ppn/P7/1P2P2N/1PBP1PPP/1NN1RRKQ w - - 0 1', 'eval': -47 },
        { 'fen': 'k3q3/1pqppppp/1rppp1pn/1pp5/BRP1P3/1R1N1P2/PNP1PPPP/BKN2R2 w - - 0 1', 'eval': 97 },
        { 'fen': '2kr1rrr/ppp1ppp1/3n2rp/1pp1p2p/1R2BR2/B3R1PP/PPPR1PBP/2NK4 w - - 0 1', 'eval': 93 },
        { 'fen': '3qkqb1/ppppp2p/1ppp1p2/3pp1r1/4P1Q1/3P1PR1/PPRPPP1P/B2R1K1B w - - 0 1', 'eval': 0 },
        { 'fen': '1r2k2q/ppbpprpp/2p1n2p/p1pb4/3P2PN/1P1PQ1P1/PPPPPBPP/3KQ2B w - - 0 1', 'eval': -163 },
        { 'fen': '1n1k1q1b/pp1pppb1/2p1n3/r2p1pb1/2P2PQP/P3B2N/2PPPPP1/BBK1RB2 w - - 0 1', 'eval': -15 },
        { 'fen': 'k1nbr3/ppqppp1p/p2p1b2/pb2pp1p/Q7/2PPPP2/PPNN1PPP/KB1RN1N1 w - - 0 1', 'eval': 26 },
        { 'fen': '1q2qbk1/1pp1pp1p/p1n4b/bp6/3P4/1RRNPQP1/NPNP1PPP/6BK w - - 0 1', 'eval': -50 },
        { 'fen': '1bb1kqq1/pp2pppp/p4n2/ppp4p/P1P1R2Q/PP1Q3P/1PPP1PP1/1BBK4 w - - 0 1', 'eval': -39 },
        { 'fen': '1k4bq/pppppp1p/qp1pb1b1/5p1p/1B1R4/2PQ2N1/PPPPB2P/2K2BNN w - - 0 1', 'eval': -64 },
        { 'fen': '1k2q1qb/1pbppp1p/2p2pn1/pp1p1p2/1BP3NP/2PP3Q/PP1BPPP1/1K1R2NN w - - 0 1', 'eval': -37 },
        { 'fen': '6rk/pbpqpppp/p2pp2p/q4p1p/P7/1PRP3N/QPP1PPPP/1NNNN2K w - - 0 1', 'eval': 0 },
        { 'fen': '2rkbn2/p1pppp2/r1r3pp/1p2nnn1/7P/3RPQBP/P2PPPPB/KN1B3R w - - 0 1', 'eval': -99 },
        { 'fen': 'brqqk3/p1pppp2/pp3pn1/7p/PQ1PN3/1N1P4/PP1PP1PP/K1RB1N1N w - - 0 1', 'eval': -46 },
        { 'fen': '3b2qk/pprppppp/p3b1p1/3rb1p1/7Q/2NN1R1P/P1PPPPB1/2Q2K2 w - - 0 1', 'eval': 25 },
        { 'fen': '2k4q/ppnppbp1/pp2r2q/5p1p/3NR3/P7/PP1PPPQN/BNNB2K1 w - - 0 1', 'eval': 0 },
        { 'fen': 'kb3brb/pp2pppp/1pp1bppq/1p2p3/7P/PQ1PQP1P/2PPPPBP/KR4B1 w - - 0 1', 'eval': 0 },
        { 'fen': '2bq1bbk/p1pppppp/rppp1p1p/7b/8/P3PRP1/QPPNPRPP/B1KB1N2 w - - 0 1', 'eval': -75 },
        { 'fen': 'nnq1n2k/pp1pp1qp/2ppppp1/7p/6Q1/B2P4/PRPPPPN1/1BK3Q1 w - - 0 1', 'eval': 0 },
        { 'fen': 'k1r1q2r/pp1prppp/5p2/1pnpppp1/2P1BP1N/P1PB4/P1QPPPRP/2B2KN1 w - - 0 1', 'eval': 33 },
        { 'fen': '1rk1r3/pppppbp1/1prr1pp1/r3pp2/P1R3R1/PP2PN1P/PRPP1PPP/1RN1N1K1 w - - 0 1', 'eval': -49 },
        { 'fen': '1nbkbr2/ppp1pppn/3pq2p/p1p1pp2/BP1P2NR/1R1P1B2/1PPB1PPP/3K1Q2 w - - 0 1', 'eval': -32 },
        { 'fen': 'knbrr1r1/p1pprpp1/pp1ppp2/3n4/3RNPPP/6PP/BPPPPPRP/4K1QN w - - 0 1', 'eval': 92 },
        { 'fen': '4b1nk/p2ppppp/2ppbrpp/2b1ppq1/P1P5/3PRRNP/PPNBPPRP/4NK1B w - - 0 1', 'eval': 0 },
        { 'fen': 'k3n1rb/pp2pppp/1p1p4/p1r1qb1p/PN6/3QPP2/PPPPPP1N/BRBK1N2 w - - 0 1', 'eval': 57 },
        { 'fen': '1r1k2q1/rnppp1pp/pp3n2/1ppb1p2/N7/PPP1P2P/PPPPBQPP/NRKR4 w - - 0 1', 'eval': -19 },
        { 'fen': 'rr3k2/rpnppp1p/3p2pp/1pp1r1pr/1R2B3/2PP2P1/PPPB1PPP/R1Q1K1R1 w - - 0 1', 'eval': 44 },
        { 'fen': 'b2rkb2/pp1p1ppb/1qp1p3/1r1p1pp1/3P4/P4N2/RRPPPPPN/RB1R1NK1 w - - 0 1', 'eval': 6 },
        { 'fen': 'rkb2nn1/pppbp2p/2rr1p2/6r1/1P3Q2/2RRP1P1/P1PPPPNP/1B2K2R w - - 0 1', 'eval': 35 },
        { 'fen': 'kr1rb2r/qp1ppppp/pp2p1p1/4p1p1/1P2P3/PB1RPP1P/PPPPRPBP/2K1N1BR w - - 0 1', 'eval': 31 },
        { 'fen': '2b1b2k/pppbpr1p/3p4/p1rb3q/1N5P/R1PP2Q1/PP1PPN1P/1N1K1B1R w - - 0 1', 'eval': 5 },
        { 'fen': 'q1rnr2k/rpppppp1/3pp3/pppp4/1P1BN1P1/B2PB3/1PP2PPP/K3R1QR w - - 0 1', 'eval': 0 },
        { 'fen': 'r2qk2n/2pppprp/1p1nb3/1p4b1/1NP4P/P2PPR2/PPP1PPPP/1RRR1K1R w - - 0 1', 'eval': -97 },
        { 'fen': 'kb3rr1/pp1r1ppp/qppp2p1/4ppp1/Q1P2P2/B1P1BPRP/1PPPBPPP/1KR5 w - - 0 1', 'eval': -55 },
        { 'fen': '3b2rk/pbp1pppp/1p5n/rprpp1r1/3P1N2/Q1PBN3/PP1PPP1P/QKN5 w - - 0 1', 'eval': -100 },
        { 'fen': '1b3q1k/ppnqppp1/1p3b2/4pn2/P1R5/3PBNP1/PPPRPB1P/1Q3NK1 w - - 0 1', 'eval': 89 },
        { 'fen': 'k3br1b/1p1pppqp/p1pb2pp/2pp1b1p/Q2P2R1/B3P2P/PPPP1P1R/BN1K2N1 w - - 0 1', 'eval': 81 },
        { 'fen': '1nq2knb/pprbpppp/p4ppp/p3p3/1R5Q/3B1P2/PPP1PPNQ/4N2K w - - 0 1', 'eval': 19 },
        { 'fen': '2b1kr2/pppprrpp/2n1pprb/1p2p3/B2R4/1B2P2B/1P1PPP1P/B1N1BKQ1 w - - 0 1', 'eval': 45 },
        { 'fen': '2k2q2/bp1pppbp/prppb2r/6pp/2QN2PQ/2P1PP2/PP2PPPP/1K2R2B w - - 0 1', 'eval': 0 },
        { 'fen': 'k4n1b/1ppqpp1p/pb2pq2/3n4/1P1P2P1/2N1NPB1/NP1PP1PP/BKRQ4 w - - 0 1', 'eval': -2 },
        { 'fen': '1q4k1/1pqppppp/p1b2rpp/1pp2p2/2P2P2/PP6/PP1P1PPP/KQ1QNN1R w - - 0 1', 'eval': 86 },
        { 'fen': '1rnn1rk1/p1p1pprp/r3n2p/3b4/RB5N/RP3NQ1/1P1PPPP1/3KR3 w - - 0 1', 'eval': 14 },
        { 'fen': '1kb1r3/p1pp1ppp/r1pnq2n/1p1pp3/PP3P2/RBP3PP/PBPPPP2/KRQN4 w - - 0 1', 'eval': 53 },
        { 'fen': 'k1nbq3/pp1pp2p/1pbp1ppp/1nppr3/6BB/3PP1PN/PPPPP1PB/2Q2RNK w - - 0 1', 'eval': 58 },
        { 'fen': '2b1brkb/rbpppp1p/1p4p1/2p2rb1/5P2/PPPP1PP1/PPPPP1RR/RBRR1K2 w - - 0 1', 'eval': -4 },
        { 'fen': 'r3kbr1/2rppppp/1rp2p2/1pp2prp/2P3Q1/1P5P/PPPRPPRP/B2BK1R1 w - - 0 1', 'eval': -53 },
        { 'fen': 'k2qr1nb/pp1pr1pp/2pp1p2/1np1p3/1PB2P1B/P3PP2/P1PPPPPP/RNBR1KR1 w - - 0 1', 'eval': -28 },
        { 'fen': 'r1q1k3/1pbppppp/2p1pn2/pn4pr/1P1P2RP/PPPB1P2/P1PPP2P/R1NB1KRN w - - 0 1', 'eval': 21 },
        { 'fen': 'rr4bk/pppp1prq/1pppp1p1/p6p/1P1PP1P1/2BPPR1P/P1NP1PPP/KN3RBR w - - 0 1', 'eval': 48 },
        { 'fen': '1k2r1n1/pppp1nnp/r1pr4/2b2r2/3R4/N1PP1P2/PPPPP1P1/1BBQN1KN w - - 0 1', 'eval': -42 },
        { 'fen': 'rq2k1q1/1npppppp/1pp3p1/5ppp/1N5R/NBNB2P1/PP2PP1P/3B1Q1K w - - 0 1', 'eval': 55 },
        { 'fen': '2n1kr2/1p1pprpp/prpbb1r1/2ppp3/4P3/B2PP1R1/RPPRPPPP/BB2NK1B w - - 0 1', 'eval': -11 },
        { 'fen': '3k1r1r/pp1ppppr/n1p1pnn1/p1r2p2/1P2PPPQ/1BP1P3/PPP1BPPP/1B4KQ w - - 0 1', 'eval': 0 },
        { 'fen': '2k1r2b/pprpppp1/1bppnb2/rpp3p1/8/1RQ2N1P/PPP2PP1/1K1BRNR1 w - - 0 1', 'eval': -71 },
        { 'fen': '1nqb2kr/p1pp1ppn/1rp4p/4b3/2P3B1/2PPPPPR/PP1PPPRP/1R1NNKN1 w - - 0 1', 'eval': -15 },
        { 'fen': 'rkrrrbb1/p1pp1p1p/4r1pp/2p5/6RR/2RPPP1P/PPPP1P1R/1NNR1K2 w - - 0 1', 'eval': -3 },
        { 'fen': '1q1n1kb1/pppppqp1/ppp1b1pp/8/8/4QP2/1PP1PNPP/RNNR2RK w - - 0 1', 'eval': 18 },
        { 'fen': 'rb1k1rrr/pp1ppp2/nnp1pp1p/4p3/N5RP/P2P4/PPPP1P1P/1RRRRB1K w - - 0 1', 'eval': -63 },
        { 'fen': '1k2b2b/pp1rpnpp/2rp4/1qpn4/1PR5/1NPN2R1/PP2PBPP/R3N1RK w - - 0 1', 'eval': 82 },
        { 'fen': '1k1bq1q1/ppp2ppp/1prpp2p/pp6/P2Q1R2/1PNPP1P1/PPRP1PPP/2BB1K2 w - - 0 1', 'eval': -45 },
        { 'fen': '1kb2br1/p2pp1pp/1pp2n2/1r2n1q1/6B1/P1P3PQ/PPRPP2P/KRN3NN w - - 0 1', 'eval': -74 },
        { 'fen': '2nbbkbr/pb2pppp/2p3p1/q6p/6N1/5QBP/PP1PPP1R/N1K4Q w - - 0 1', 'eval': -80 },
        { 'fen': '2n2qnk/npppppr1/1pp1pppp/3p3n/1R2R1B1/P6N/NPPRPPP1/5KQ1 w - - 0 1', 'eval': -88 },
        { 'fen': '1r1k1rrn/1ppp1pp1/4bp1p/2rr2p1/7P/P3PRRR/PPP1PPP1/1N3QKB w - - 0 1', 'eval': -21 },
        { 'fen': '5k1q/pqppp1pp/p1pn1b2/1p1pn1p1/P7/P2N3P/NP1QPPPP/1Q1KN2B w - - 0 1', 'eval': 33 },
        { 'fen': '1nk2r2/ppppqbpn/1pb1p1n1/4p3/N3N3/5PR1/PQNPPNPP/1NN3K1 w - - 0 1', 'eval': -12 },
        { 'fen': '2r1k3/ppppppqr/p1pp1rp1/p2p1n2/1P1P1P2/PP1B1P2/PRPPPPN1/1K2RB1Q w - - 0 1', 'eval': -85 },
        { 'fen': '4q1nk/1pqppppp/p2pp2p/p3n1n1/R1BP4/P3P3/PPNP1PPP/1NKQ1NB1 w - - 0 1', 'eval': 0 },
        { 'fen': 'rrbk3b/ppprp1p1/2r1np1b/8/1RNQR3/4N1P1/1PPPP2P/B2R1K2 w - - 0 1', 'eval': 0 },
        { 'fen': '1b2kb2/p2pr1pr/2p1bp2/6br/8/PPPQ2PR/RB1P1PP1/5KBN w - - 1 4', 'eval': 0 },
        { 'fen': 'k2b4/1npp1q2/1b2pp2/4p3/PqP1P2P/1P1R3P/RRPP1PPP/K2N1B1B w - - 1 4', 'eval': 18 },
        { 'fen': '1k1r4/1ppqpnp1/p2r3p/1n3b2/1P5P/PP1RR1RP/P2PPPP1/RB4RK w - - 0 3', 'eval': 14 },
        { 'fen': '1n2kbb1/3ppp2/pp3p2/ppp2B2/3B3R/q3P1N1/B1P2P1P/B4K1N w - - 0 4', 'eval': -26 },
        { 'fen': 'krn4r/p1ppprpp/1p3pp1/1Pr5/5PN1/PPRP2PB/1PP3P1/1K2Q3 w - - 1 5', 'eval': -22 },
        { 'fen': 'nrq3k1/1p4pp/bbppb3/p7/P4rP1/PP1P1PNP/PP2P2R/QK2BR1B w - - 3 3', 'eval': 13 },
        { 'fen': 'r1r3k1/2pn2rp/bp2p3/4r1p1/7B/P1PRPP2/KP3NPP/5RRR w - - 0 5', 'eval': 29 },
        { 'fen': 'r3kq2/nppppb1p/7p/n5Pp/2P1Pp2/PR1P1P2/PPP1P1R1/1BN1KNB1 w - - 0 4', 'eval': -11 },
        { 'fen': 'b1bn1q1k/2p1pp1p/1p4p1/8/3P4/2PPP1BB/q2P1KPP/1BN2R2 w - - 0 3', 'eval': -32 },
        { 'fen': 'k2q2b1/pb1b1ppp/n1prp3/2B2p2/1P6/PR1P3P/1PP1n1P1/KR1R1Q2 w - - 0 3', 'eval': 33 },
        { 'fen': '1r2q1kn/p4ppr/R1p1p2r/1pBp1pp1/2P3R1/P1R1P1P1/NPPNP2P/BK5B w - - 0 3', 'eval': 23 },
        { 'fen': 'k1b3b1/np1b2pr/p2pnb2/2p5/3R4/PP1QB3/2P1P2P/KN4Q1 w - - 0 4', 'eval': -24 },
        { 'fen': 'r2kr2b/1prnp1p1/1ppppp1b/1n6/3PP1p1/1P1PP3/1P1P1PNP/NQ1NKNR1 w - - 0 2', 'eval': -31 },
        { 'fen': '1n1k2r1/1p2ppN1/np1b2pp/4p1n1/PPq4P/3R2PP/PPPRP1R1/5KRR w - - 1 3', 'eval': 29 },
        { 'fen': '1k1b1q2/pp2pppr/1p1p1prp/n2p2pp/1NR3p1/3PR2P/1P1PP2R/1NK1NQ2 w - - 0 3', 'eval': -30 },
        { 'fen': 'k1rrr2r/ppp3p1/r1p1pnp1/2P3p1/1p1PQ2P/PPRPPP1P/RPRPP3/4KB2 w - - 1 3', 'eval': -9 },
        { 'fen': 'k5nb/B3pppp/p1qp1ppn/q7/8/PPR2p2/PP1PKBP1/NR2B2R w - - 0 5', 'eval': -4 },
        { 'fen': 'kn2r1nb/1p1ppppp/p1qpn3/P3pp2/pP2N2P/2PB1P2/1P2R2P/KRNRBB2 w - - 0 4', 'eval': 13 },
        { 'fen': '1rq2k2/r1pppppp/pppn1p1p/Q3ppp1/B7/2P3PP/PP3PP1/NKNR2RB w - - 0 2', 'eval': 25 },
        { 'fen': '3qk1n1/np1pp2n/p5p1/p5pn/2r3R1/P1nP2P1/PRP4P/3NQ1BK w - - 0 3', 'eval': -7 },
        { 'fen': '2k4r/1brpppp1/p1pprnpp/1np4p/N7/1PB2P2/P1PN1BPQ/K5N1 w - - 1 4', 'eval': -24 },
        { 'fen': '2k3n1/1pqppp1p/pn1p3p/p1pppp1Q/Pq6/1Q2P1P1/1PPR1P2/2KB2B1 w - - 3 4', 'eval': -4 },
        { 'fen': '3nk1r1/p1pp1pp1/q1p1p1p1/3pB1pp/1p2R3/2RPP2P/1P1N1PPP/6KR w - - 0 3', 'eval': -4 },
        { 'fen': '1knrb1q1/pppnp2r/4ppp1/2pp3p/R2B4/5QPP/PPP1N1B1/B1K3NR w - - 0 3', 'eval': -1 },
        { 'fen': '4b2k/b2q1ppp/7n/4p3/qNp5/P1P2RNP/1BPPPPP1/1RKR2R1 w - - 0 5', 'eval': 8 },
        { 'fen': '2kbbq2/1ppp3b/pp3ppp/pq3pP1/1P2P2N/QPP1P1NP/2PPPPPQ/B3K3 w - - 0 3', 'eval': 29 },
        { 'fen': '1rrr3k/p3qppp/1p2pppb/pP2pp2/2R5/1PNN1N1P/3PPQP1/1KQ5 w - - 1 3', 'eval': -23 },
        { 'fen': '1b1b1k1r/p1pp2p1/pppppp1r/2p2P1p/P5pq/2PP1B1P/PP1QP1P1/R2R1NRK w - - 0 5', 'eval': 4 },
        { 'fen': '1r1kr1b1/p1pnp1pp/p2p2r1/1p1bpb2/6P1/6PP/2PPPPQB/1K1NBRNN w - - 4 3', 'eval': -3 },
        { 'fen': 'k1q2rb1/b2bp1pp/1pp1n3/3rP3/R2P4/PPP2RPP/PPR1PP1P/2K1RN1B w - - 1 3', 'eval': -22 },
        { 'fen': '1rrr3k/pp2pr2/1p1p1p1p/2ppb1r1/P5P1/3N1P1P/N1PP4/1KNN1RQ1 w - - 3 4', 'eval': 15 },
        { 'fen': 'rb2b1b1/2ppkrrp/p6p/4p3/8/3P1B1P/2P2PPR/R1RBK3 w - - 0 3', 'eval': 14 },
        { 'fen': '1rqk2n1/pp2rp2/1npp1pp1/1np3p1/7p/PP3Q1P/BBPP1PR1/1B1K2NR w - - 2 5', 'eval': 24 },
        { 'fen': 'b4k2/nq2p1pp/3pnrp1/1p3p1p/1Br4P/1Q2PP2/PP2PRP1/3RNK1R w - - 2 5', 'eval': 32 },
        { 'fen': '1r1r3r/prrp1pk1/1ppn1n2/1p4pp/1P3R2/3PPB2/P3B1P1/1N1N1NKQ w - - 0 5', 'eval': 18 },
        { 'fen': '2qk1n1r/2pppppr/ppp1pp2/1p6/2R2Ppb/2P3P1/PP2P2B/B1KQR2R w - - 0 3', 'eval': 14 },
        { 'fen': 'k2qq2b/ppp2p1p/b3p1b1/2p5/8/PR2PPPP/1PPPPQPP/B1RR1K2 w - - 0 3', 'eval': -4 },
        { 'fen': 'k2b2b1/1p1pbp1p/pq3ppp/5qp1/2p1N3/1N2RPPR/PPPP3N/KQ3B2 w - - 0 3', 'eval': -12 },
        { 'fen': '4rk2/q2ppbpp/pbp1p1p1/1p2p1P1/4P3/RRp1PP1P/PPPP3P/1R1N1KR1 w - - 0 4', 'eval': 21 },
        { 'fen': 'k2n1qb1/p3p2p/prpp1prp/p1p1pp2/2p5/2PPQ3/PBN1P1PQ/2B2N1K w - - 0 4', 'eval': -27 },
        { 'fen': 'bb3rk1/pp3p1r/2pp1bpp/1p6/4p3/3PN1NP/NP2PP2/B2QK3 w - - 0 5', 'eval': 13 },
        { 'fen': '3rr2k/n1rbpp1p/4nqp1/2p5/2P3PP/1P1PRNP1/R1PQP1P1/1KN2R2 w - - 1 5', 'eval': -22 },
        { 'fen': 'r3k3/pp3pnp/1p1ppqrp/p1pP1ppp/p7/1N1BPPPP/2PPRPB1/R2N1B1K w - - 0 2', 'eval': -32 },
        { 'fen': 'bq2bk1b/rp2pp2/2pp1p1p/pRpp4/P1P5/1PP3P1/RN1PP1RP/3RKR1B w - - 2 3', 'eval': -17 },
        { 'fen': '2bknqb1/pp1r2np/pp1ppppp/8/p3PPP1/P2R3R/BPPPPQPP/1K3R2 w - - 0 3', 'eval': -30 },
        { 'fen': 'k3bn2/1nppb3/pp6/b2B1p2/5BRP/1Pr3B1/P1P2P1R/3K4 w - - 0 5', 'eval': 13 },
        { 'fen': '2n1krb1/p1p3np/2rb1pp1/1r6/r3P1PN/3P3P/1BPBPP2/1QR2K1R w - - 2 4', 'eval': -26 },
        { 'fen': 'brrk1r2/1pp3np/pppnpbpp/p2p4/P4PB1/PP1PPP1P/P1PPPR2/2Q2RRK w - - 0 4', 'eval': -16 },
        { 'fen': '1q2bk2/pp1brp2/b3pp2/2p1r3/PR2p3/1N2P1PB/1PQPPP1P/1N4KB w - - 0 4', 'eval': 8 },
        { 'fen': 'knnqn3/ppbppBr1/2p3p1/8/8/2nPPP1P/PPP1N1P1/1KRR2QB w - - 0 2', 'eval': -33 },
        { 'fen': 'r2kq3/ppp1p2r/rpnp2p1/1p1ppN1p/PN2P1Q1/P1P1P1PR/R1PPRP2/5K2 w - - 0 2', 'eval': 22 },
        { 'fen': '1kb2nr1/pp3r1p/2p5/1n1n2p1/qP4PB/2BQ2PP/BPPN2P1/KQ6 w - - 0 4', 'eval': -23 },
        { 'fen': '2r1n3/1p3ppq/p1kp2p1/pp1Np1b1/P2q4/P1NQ1PPP/P1P2PPR/4KRR1 w - - 6 4', 'eval': -30 },
        { 'fen': 'k1b5/p2b1qqp/5ppn/1Pp1p3/4P3/PPR2P1P/1PPPP1PP/1RK1B1Q1 w - - 0 5', 'eval': 4 },
        { 'fen': '1q1rk1b1/p2p1n1p/1p2p2n/6pp/1P1B4/PP1P1P2/1P3BPP/RK1NRN2 w - - 2 5', 'eval': 3 },
        { 'fen': '1r2rnkr/1p1pprp1/pp1pp2p/bp6/P2RN3/4nPP1/1R1PPN2/1NRRK2R w - - 1 4', 'eval': 21 },
        { 'fen': '1k6/ppp3qp/1pp2bp1/1p4pp/1P1r1p2/PB1PNP1P/PPPPP3/2KB1Q2 w - - 0 5', 'eval': 28 },
    ];
    const positions_oneset = [
        { 'fen': '1bk1bn1r/pppp1p2/r2q3p/pp1n4/4B1P1/3NPR2/PPPPPP2/1N1BRQ1K w - - 0 1', 'eval': -33 },
        { 'fen': '1r1qbk1n/ppp1rppb/p2n4/4p1p1/P4PN1/RB1P3B/1PP1NPPP/4KR1Q w - - 0 1', 'eval': 53 },
        { 'fen': '1knr1rb1/1pp1pppq/n4pp1/b5p1/P3P3/2PBN1QB/PP1P2PP/RN1K2R1 w - - 0 1', 'eval': 24 },
        { 'fen': 'k1b1n2r/1pb1pppp/p1rn1p1p/1q6/1B1B2P1/1N1PP3/PPR1PPRP/1K2NQ2 w - - 0 1', 'eval': -46 },
        { 'fen': '1rnnkqb1/prppppp1/7p/1pb5/B5P1/2Q2PN1/PPNPPPP1/R1K2RB1 w - - 0 1', 'eval': -36 },
        { 'fen': '1n1kbq2/rppppppp/p2r1b2/3n4/6P1/N2NRP1B/PPP2PPP/2RQKB2 w - - 0 1', 'eval': -92 },
        { 'fen': 'kb6/pppp1rpp/1n1p1brp/2q1n3/2N1PR2/2N2PP1/PPPQPP1B/1RKB4 w - - 0 1', 'eval': 0 },
        { 'fen': 'q1b1k1n1/ppppnp1p/r1pbr1p1/8/P1R1R3/1BNP3P/P1B1PPPP/K1N1Q3 w - - 0 1', 'eval': 60 },
        { 'fen': '4k2r/rpp1ppnp/qn3bp1/3pb2p/NPQ4B/4P2P/PP1PNPP1/1R1BKR2 w - - 0 1', 'eval': -16 },
        { 'fen': 'bk3nq1/p1ppp1pp/1p1rp1br/3n4/3BPR2/2PP4/BP1PPP1P/NNQ2RK1 w - - 0 1', 'eval': 66 },
        { 'fen': '1qnkrb1b/pppp2p1/1n1r2pp/5p2/P7/PR3P2/1NPPBPPP/1BKR1NQ1 w - - 0 1', 'eval': -33 },
        { 'fen': 'b4n1k/1pppprpb/2np1p2/q2r2p1/1RNPQ1R1/NP2B2P/2PP1PPP/1B1K4 w - - 0 1', 'eval': -11 },
        { 'fen': 'kb2nq2/1ppnpprp/b1p3p1/p5r1/7N/PR1P1B2/BPPPPPP1/2RNK2Q w - - 0 1', 'eval': -58 },
        { 'fen': '5k2/1p1bpppp/r1pn2rq/pp2n1b1/4P2Q/NB2NP1P/BP1PPRPP/3R1K2 w - - 0 1', 'eval': 25 },
        { 'fen': 'k1qnn3/pppppp2/rbp1rb2/1p6/P3R3/2BP1NP1/PP2PP1P/R1B2NKQ w - - 0 1', 'eval': -6 },
        { 'fen': '2bbq1kr/ppp1prpn/1p1n2pp/8/3R1R2/P1P1P3/1PPP1PPB/K1B1NQN1 w - - 0 1', 'eval': 28 },
        { 'fen': '1n3k2/bppp2pp/pr2np1q/br4p1/3RPN2/P3PR2/P1PPBPP1/KN2Q2B w - - 0 1', 'eval': -19 },
        { 'fen': 'nrbn1k1r/p1pbpppp/1p4q1/5p2/NBP5/5NPP/BPPPP1RP/2R3KQ w - - 0 1', 'eval': -2 },
        { 'fen': 'kq1r1r1n/1ppp1ppp/pp1b1n2/3b4/3P4/P2QPB2/NPPPPP1R/1B1N1RK1 w - - 0 1', 'eval': -52 },
        { 'fen': 'k2r1b1b/qpppp1pp/4n1p1/1rp2n2/4P1R1/2PP3R/PP1BPPPB/1N1KNQ2 w - - 0 1', 'eval': 27 },
        { 'fen': '2r1n1rk/ppppp1qp/bn5p/4p1b1/1P5N/2P1P3/1NPPQPPP/R1B2BKR w - - 0 1', 'eval': -33 },
        { 'fen': '1n1qkrr1/2p1pppp/3np2b/4pp1b/P2P1NR1/P1B1R1N1/1PPPQP1P/4B1K1 w - - 0 1', 'eval': 0 },
        { 'fen': '2n2rkb/1ppp1ppp/3qpp2/3n1b1r/NP1P3N/P7/1PPB1PPP/BQK2R1R w - - 0 1', 'eval': 74 },
        { 'fen': 'k2nnb2/p1pppp1p/1p3q2/2r2brp/N2RP3/N1P4P/P2PPP1P/B1R2KQB w - - 0 1', 'eval': -19 },
        { 'fen': '3nbb1k/p1nppqpp/6p1/1r2prp1/1P6/1PP1NB2/PPN1PPRP/R2K1Q1B w - - 0 1', 'eval': 83 },
        { 'fen': '1nnq2rk/p1pppb1p/3bpp2/6rp/3BP1P1/3NP3/1PRPRPPP/1B2KNQ1 w - - 0 1', 'eval': -75 },
        { 'fen': 'r2bbk1n/1ppp1pp1/1p2q2p/2p2rn1/1NR2P2/PPN5/2PPPPRP/B3KB1Q w - - 0 1', 'eval': 0 },
        { 'fen': '1knnr1q1/ppp2ppp/1p1p3b/4rb2/1RBQP1R1/5NPP/P1PP2PP/5KBN w - - 0 1', 'eval': 39 },
        { 'fen': 'nrr2k2/qp1ppppp/n1p3b1/3b3p/N2N3P/3PRPB1/PP2PPP1/R1QBK3 w - - 0 1', 'eval': -2 },
        { 'fen': 'n2rk3/nppppp2/p2r1q1b/4pp1b/3P4/1P2P2B/P1PPRPP1/N1KBQN1R w - - 0 1', 'eval': 19 },
        { 'fen': '2nr1kbn/pqppp1pp/1bp2p2/3r4/1N3R2/3PNPP1/PPP1PRP1/QB2B1K1 w - - 0 1', 'eval': 38 },
        { 'fen': 'q1rn1n1k/ppbpp1pp/b4p2/pr6/1B3P1B/5NP1/PPP1PPRP/N3QR1K w - - 0 1', 'eval': 43 },
        { 'fen': '1br1n2k/2ppppnp/pq6/rpbp4/P3P3/1RP1B3/PP2P1PP/1KRNQN1B w - - 0 1', 'eval': 38 },
        { 'fen': 'nkr1n1b1/p1ppp2p/rp1b4/2q1p1p1/4QP2/2P3P1/PP1P1PPN/NRK1B1BR w - - 0 1', 'eval': -30 },
        { 'fen': '2b3rk/1prppp1p/nppnbq2/4p3/R2N4/1NR2P1P/1PPPQPPP/4B1BK w - - 0 1', 'eval': -70 },
        { 'fen': 'b1k4r/pnprppp1/1p1qb3/np5p/3P4/RR1BPBNP/PNP1PPP1/4QK2 w - - 0 1', 'eval': -37 },
        { 'fen': '2b1rrqk/ppppppnb/3n1pp1/8/3R3P/N1P4P/PPBP1RPP/N1BK1Q2 w - - 0 1', 'eval': -56 },
        { 'fen': '1nbn2kq/1ppr1ppp/2r2p1b/2pp4/2N5/2P1PB1R/PP2PPPP/NQ3KRB w - - 0 1', 'eval': 61 },
        { 'fen': 'kr1nb1qr/pp1ppbpp/n4p2/7p/P2B3P/1RP2N2/1PBPPPPR/1Q2NK2 w - - 0 1', 'eval': 43 },
        { 'fen': 'krb3n1/ppp1pr1p/pp3p1n/1q4b1/6BP/1P1P4/PBP2PPP/NNQRKR2 w - - 0 1', 'eval': 37 },
        { 'fen': 'b1nkr1q1/n1pppppp/5p2/p2b3r/P7/P2R3P/1PPPRQPP/1B1NK1BN w - - 0 1', 'eval': 23 },
        { 'fen': 'n1kb2qr/pp2pppp/p2rp1n1/b7/P2B1RN1/2P1P3/PPPP1P1B/2Q1K1RN w - - 0 1', 'eval': -113 },
        { 'fen': 'nbk3q1/1ppppp1b/rn2rp1p/4p3/1B6/2P1QPP1/PPPNP2P/BKR2N1R w - - 0 1', 'eval': 5 },
        { 'fen': '2br3k/n1pnpppp/1q1pp1r1/2b2p2/1NB4P/3PP3/PRPB1PPP/2RQ1K1N w - - 0 1', 'eval': 0 },
        { 'fen': '3rnbk1/p1pppppp/1b1p3q/2r3n1/2PR4/PB1P2NN/1RPPPBPP/3K2Q1 w - - 0 1', 'eval': -94 },
        { 'fen': '1kqbb3/ppprpppp/1p3r2/3n2n1/P3R2R/1Q1P2NP/1P1PPPP1/BN1KB3 w - - 0 1', 'eval': -74 },
        { 'fen': '1r2kb2/p1bppppp/2pp1r2/1qn4n/4N3/BP4PP/1P1PPP1P/KBNR1QR1 w - - 0 1', 'eval': 30 },
        { 'fen': '2q1k2n/ppbn1ppp/r2ppp2/3b2r1/PB4P1/2Q1N1P1/P1P1PPP1/K3RBRN w - - 0 1', 'eval': -84 },
        { 'fen': '2r2bkn/pb1pppp1/1p1n2r1/1q1pp3/1PR5/1P1RNP2/PP3PPP/N1QK1BB1 w - - 0 1', 'eval': 56 },
        { 'fen': 'r1k1r2b/ppp1qpp1/3npn1p/1b3p2/1P5B/1BNP1R1P/R1P1PPPP/1N3K1Q w - - 0 1', 'eval': -60 },
        { 'fen': 'q1kb3r/p1ppppp1/1n1rp1p1/b5n1/4N1P1/4P2B/PPPQPPRP/1RB2N1K w - - 0 1', 'eval': 139 },
        { 'fen': 'b2k2r1/qpppppn1/1p1n2pr/3bp3/P7/2B2P1P/PPPPP1RQ/N1K1RNB1 w - - 0 1', 'eval': 83 },
        { 'fen': 'rbq1b2k/ppprp1pp/2np1n2/2p5/4Q1PB/BP2RP2/PPPPNP2/R1NK4 w - - 0 1', 'eval': 0 },
        { 'fen': '1k1rqbn1/pb1rpppp/1p2p3/2n3p1/7P/N1R1PP2/1PPPP1PR/1BB1KQN1 w - - 0 1', 'eval': -29 },
        { 'fen': '1kn2rbq/pn1ppp1p/p1pb4/1p3r2/1BPP4/5P2/PPPPPR2/NRBK1N1Q w - - 0 1', 'eval': 12 },
        { 'fen': 'rnq1kn1b/p1pppppr/1pp5/3b4/2P4B/P2P1R1B/P1P1PPNP/QR1KN3 w - - 0 1', 'eval': 30 },
        { 'fen': '2q3nk/rppppprp/3n1bpb/p7/4PQ2/3P2PN/PP1PPP1B/KRB1NR2 w - - 0 1', 'eval': 76 },
        { 'fen': 'k1bb1rn1/pnpp1prp/2qp2p1/5p2/5R2/PP5B/BPPPNPPP/RK2N1Q1 w - - 0 1', 'eval': 7 },
        { 'fen': 'b1rk3n/rpq1pppp/1ppb4/n4p2/P7/P4R2/PRPPPPNP/1N2BQKB w - - 0 1', 'eval': 50 },
        { 'fen': '1krq2bn/rppppppb/p7/3n3p/1R1PN2B/3NR2P/P1PPPPP1/1Q3BK1 w - - 0 1', 'eval': -22 },
        { 'fen': 'bq3nk1/r1pp1ppp/2n3pp/2pb1r2/1P6/B1NB3P/1PPPPPP1/1RQ1KN1R w - - 0 1', 'eval': 67 },
        { 'fen': 'kn1r4/qpppbppp/r1p5/1n1p1b2/P1B5/PP3R2/NPRPBPPP/1N3K1Q w - - 0 1', 'eval': -52 },
        { 'fen': 'n1n2b1k/1p1pppqp/p2bppr1/4r3/3RP3/N2P2B1/PPPBP1PP/Q1N3KR w - - 0 1', 'eval': 0 },
        { 'fen': 'r1nkq1b1/2pp1ppp/1pb2pr1/2p2n2/4P2N/1B1Q3P/PP1RPPPP/RKN4B w - - 0 1', 'eval': 0 },
        { 'fen': '2rqn2k/pppp1pb1/3n3p/b1p1p2r/6NP/1PPR4/NP1PP1PP/QK2BR1B w - - 0 1', 'eval': -4 },
        { 'fen': '3q1k1r/1pppnbpp/5pnp/1br1p3/P2R1P1B/3BP3/PPP3PP/2KNQ1RN w - - 0 1', 'eval': 0 },
        { 'fen': '3kqb2/ppppp2p/b1n3pp/1n1r1r2/6NB/2P1Q1PR/1PPPPP1P/B1N2KR1 w - - 0 1', 'eval': -29 },
        { 'fen': '1brrnk2/pnppp1pb/2p2q1p/3p4/7Q/PP2N1BP/2PPPPP1/RNK3BR w - - 0 1', 'eval': 36 },
        { 'fen': '1kr1n2n/p1pppp1b/pb1q2p1/1pr5/PNB3NP/P3R3/1P1PPP1P/RQK1B3 w - - 0 1', 'eval': 51 },
        { 'fen': 'b2n2k1/rpppp1pr/q2pb2p/2n1p3/8/NB1P1P2/P1P1PPPP/Q1BNR1KR w - - 0 1', 'eval': -41 },
        { 'fen': 'r1nbk3/1prpppp1/p1p3qn/b4p2/1NP4P/R4P1B/P2PPPPN/1K1BRQ2 w - - 0 1', 'eval': -49 },
        { 'fen': '1bn1r2k/2pprppp/p4qp1/2p1b1n1/1PN4R/3P2P1/1PPRPPP1/NQ2BK1B w - - 0 1', 'eval': 1 },
        { 'fen': 'r3kq2/pppp1ppn/b3p1b1/1n2p2r/2R2B2/2PP3P/1PQPPPP1/RKN1BN2 w - - 0 1', 'eval': 0 },
        { 'fen': 'bk2r1q1/ppp1pn1p/2nb2p1/2rp2p1/1RN5/P2N2PP/QPPPP1PB/1K2B2R w - - 0 1', 'eval': 1 },
        { 'fen': '1q1nbkr1/1ppp2pp/2rn1p2/p2p3b/PN6/1R2RPP1/PPBPPP1Q/K1B4N w - - 0 1', 'eval': -51 },
        { 'fen': '4k1bn/p1ppp1pp/qp1r1prb/3n4/P2P3R/4N2P/QNPPPPBP/2B1K1R1 w - - 0 1', 'eval': -30 },
        { 'fen': '1kr2b1n/1bp1pppp/1pqpn3/p1r5/NR6/1P1QP1B1/1PPPNPPP/3R2KB w - - 0 1', 'eval': -8 },
        { 'fen': 'qnnk3r/pppbbpp1/3pp3/2p2r2/7N/1RPPR1P1/PPPPQP1B/1N1K2B1 w - - 0 1', 'eval': -55 },
        { 'fen': '3kb1rq/pppnpppr/4b1p1/4pn2/2QP3P/PNB3BN/1PPP1PPR/2R1K3 w - - 0 1', 'eval': 49 },
        { 'fen': '2rknqb1/prpp2pp/5p1n/1p1bp3/1B3Q2/1N1PP1P1/PPPRPRP1/3BK1N1 w - - 0 1', 'eval': 0 },
        { 'fen': 'b3q2k/pr1pp1pp/2p1bp2/prn2n2/PB6/PR3Q1P/RPPPP1P1/1BNK1N2 w - - 0 1', 'eval': 37 },
        { 'fen': 'r1kb2r1/pppp2pq/2nb1p2/n1p3p1/BP1NR2B/P2Q3P/1PPPPNPR/K7 w - - 0 1', 'eval': 0 },
        { 'fen': '2nk2q1/pp1bppp1/ppp2nr1/rb6/4NP2/P1BR3P/1PPP1P1P/RQKBN3 w - - 0 1', 'eval': 31 },
        { 'fen': 'kn2n1q1/1pppp1pp/p2r1bb1/4pr2/1P2NP2/P1N3B1/RPPBP1PP/Q2K2R1 w - - 0 1', 'eval': 0 },
        { 'fen': '1b2kqn1/ppp1pp1p/pb2r2r/4n2p/PB4P1/Q1RP4/PPPNP1PB/K3N1R1 w - - 0 1', 'eval': 0 },
        { 'fen': 'k1q5/pb1p1ppp/rnp3p1/2p1r1bn/BNP5/Q2B2P1/PPPRPRPP/K4N2 w - - 0 1', 'eval': 75 },
        { 'fen': '1r3qrk/pp3ppp/b2b1pp1/3n1pn1/RP5P/1B5P/PP1PNPBP/Q2K1N1R w - - 0 1', 'eval': -114 },
        { 'fen': '1b4k1/pppq2pp/3p2pr/1n1brnp1/2Q3B1/PR2PNR1/1PPPPPPB/4K2N w - - 0 1', 'eval': -64 },
        { 'fen': 'r1r2knn/ppppp1q1/p1b2p1b/7p/1PB4N/1R2Q1P1/PPP1P1PP/K4NRB w - - 0 1', 'eval': -72 },
        { 'fen': 'r1qrk1bb/ppp1np1p/2np3p/1p6/8/PP1RNPBR/1PP1P1PP/1N2KB1Q w - - 0 1', 'eval': -26 },
        { 'fen': '2k2nq1/bppp1p1p/r1r3p1/1b2p1pn/3RNP2/B3BP1P/2PP1PPP/1QR1KN2 w - - 0 1', 'eval': -105 },
        { 'fen': '1nb2qrk/pppppppb/2p2r2/5n2/R7/2P2NP1/PPPP1P1P/BQ1BKRN1 w - - 0 1', 'eval': -79 },
        { 'fen': '1rnr1kb1/pppppq2/1pn1b2p/2p5/1NP5/3PN1Q1/PP1PP1PP/RRK2BB1 w - - 0 1', 'eval': 75 },
        { 'fen': '1n1k1r2/p2ppppq/1pb2p1p/2rnb3/BP6/P1B2P2/P1NPRPPP/2RKQ2N w - - 0 1', 'eval': -37 },
        { 'fen': '2n1nkqr/pppbrpp1/4p2b/p2p4/1R6/P2P2B1/P1NPPPPP/1KQ2NRB w - - 0 1', 'eval': -55 },
        { 'fen': 'r1n3bk/ppp1p2p/2qb1pp1/n1r1p3/5P1P/NNPBQ3/PPRP1PPB/R1K5 w - - 0 1', 'eval': 61 },
        { 'fen': 'rqbkrnb1/pp1ppp2/p3p3/n1p5/1R1BP1N1/P3PRQ1/PP1PPP2/3N2BK w - - 0 1', 'eval': 0 },
        { 'fen': 'b1qk1nb1/ppn1ppp1/3r3p/1p1r2p1/5PN1/4R1PB/PPPPPPN1/BK1QR3 w - - 0 1', 'eval': 90 },
        { 'fen': '1b2k2n/bppnprpp/p5q1/rpp5/3PR1N1/N3PB1P/PP1PQP1P/1K3RB1 w - - 0 1', 'eval': 46 },
        { 'fen': 'b2r2kb/pp2p1pp/rnpq4/1pn4p/7N/2NP4/PPPRPPPP/R3QKBB w - - 0 1', 'eval': -7 },
        { 'fen': '1bk1r1nq/ppppp1bp/1n1rpp2/8/3P4/1P1P1B2/PPRNQPPP/4NBRK w - - 0 1', 'eval': 0 },
        { 'fen': 'kbrq4/pp1ppp1p/p5r1/p4nbn/1N2P3/Q1PRNP2/PPP1P1P1/K1RBB3 w - - 0 1', 'eval': -40 },
        { 'fen': 'kb1n4/pp1prqpp/1r1pppbn/8/7P/NBP1Q1P1/PPNP2PP/2B2RRK w - - 0 1', 'eval': 0 },
        { 'fen': '2rr1qkn/1ppppppn/4b1bp/5p2/2P1B1P1/2PN4/NPQPPPP1/2RK2RB w - - 0 1', 'eval': -70 },
        { 'fen': '1n1br2k/1pp2ppp/pn1r1pq1/6bp/1P5B/1Q4P1/PPNPPPNP/1K3RBR w - - 0 1', 'eval': 39 },
        { 'fen': 'kb1bn3/pn1prppp/p3p3/pq5r/8/P3P1PR/PBPNPPPQ/3BN1RK w - - 0 1', 'eval': 85 },
        { 'fen': '1knrn3/rpp1pppq/1bppb3/p7/5P1P/R1R1BNP1/PNPPP1QP/5B1K w - - 0 1', 'eval': 0 },
        { 'fen': '6kq/pprpppp1/p2b2bn/2rp3n/2P5/NP5P/PPNPPP1B/2RRQKB1 w - - 0 1', 'eval': 0 },
        { 'fen': '1bkqrr2/pp1npppp/2p4p/2n1b3/4B2P/5PPN/PPP1P2P/QRNRK1B1 w - - 0 1', 'eval': 0 },
        { 'fen': '4b2k/p1p1nppp/3p1q2/rrnpb2p/7N/BR2P2P/P1PPPPP1/3NBQRK w - - 0 1', 'eval': 40 },
        { 'fen': '1q1nk3/ppbrpp1p/p1ppn1b1/1r6/R2P2N1/B2B1QP1/PRPPP1PP/4K1N1 w - - 0 1', 'eval': -39 },
        { 'fen': 'k1nb1q1n/ppppp1p1/r3rpb1/1p6/1PQ2BNP/4R2P/PPPPP3/1KN1R2B w - - 0 1', 'eval': 78 },
        { 'fen': 'qn1b1kbr/1pppppn1/1r3p2/5pp1/2P5/P1R2P2/BPBPRPPP/NK1N1Q2 w - - 0 1', 'eval': -4 },
        { 'fen': '1q3k2/pppn2pp/prr1bpnp/b7/R3NBQ1/2PP3P/PPPNP1P1/1BRK4 w - - 0 1', 'eval': 101 },
        { 'fen': 'q2n1rk1/pppb1ppp/3pnpb1/2r5/PB6/P1N4P/RP1QPPPP/N1B2KR1 w - - 0 1', 'eval': 53 },
        { 'fen': '1k6/pp1rppp1/1npbprnb/pq6/6PB/P3P1R1/PNP1PPP1/BN2QR1K w - - 0 1', 'eval': -54 },
        { 'fen': 'k1q1b1r1/1p1ppnpp/2p4r/n2pp2b/2N1B3/4P1BP/PPPPQPRP/RN5K w - - 0 1', 'eval': 0 },
        { 'fen': '1rb1nk1r/pppp3p/p3pbpn/7q/1N3P1Q/1R1RP1BP/1P1PPPPB/N3K3 w - - 0 1', 'eval': 33 },
        { 'fen': '2k1nqn1/pbpprp1p/3pr1p1/4b1p1/7P/N1P2P2/PP2PPBP/1BRQKN1R w - - 0 1', 'eval': 2 },
        { 'fen': '1k1br1q1/pp1ppn1p/1pp2p2/r3n2b/4R2Q/BPNPB2P/1PP1P1PP/2K3RN w - - 0 1', 'eval': 0 },
        { 'fen': 'r1b1rqk1/1pp1ppnp/2p5/np4pb/3NP3/NP1QPB2/B1PPP1PP/K2R1R2 w - - 0 1', 'eval': -64 },
        { 'fen': '1b1q1k2/1bpprppp/pn2rp2/3p3n/2PP4/1B1PBN2/NPP1P1PP/Q2R2RK w - - 0 1', 'eval': -67 },
        { 'fen': '1n3krq/pb1pprpp/n2p1p2/6bp/1N3RBN/PB3P2/1PPPPP1P/K1Q2R2 w - - 0 1', 'eval': -38 },
        { 'fen': 'kr1rn1nq/pbp1pp1p/b2p4/4p2p/B2P4/R2P2N1/P1PBPPPP/1KR1NQ2 w - - 0 1', 'eval': 20 },
        { 'fen': 'br1r1k2/pppn1ppp/2q1p1nb/3p4/RP2P3/1P2B1NR/P1P1P1PP/1BNQ2K1 w - - 0 1', 'eval': 0 },
        { 'fen': 'nq2kr1n/prp2ppp/2p1b3/1b1p2p1/Q4NP1/PRBPN3/2PPPPRP/3B1K2 w - - 0 1', 'eval': -16 },
        { 'fen': '3b1knq/p1ppppp1/1p2b2r/2nr1p2/N1Q2PPB/4RP2/1PPP1NPP/R2B3K w - - 0 1', 'eval': -62 },
        { 'fen': '1nk3b1/ppp1prp1/2nbp2p/1p1r1q2/PP6/3NP2Q/1RPPRPPP/B1KB2N1 w - - 0 1', 'eval': -8 },
        { 'fen': '1knbqbr1/ppppnprp/4p3/7p/QN6/P2P4/PPPPPP1B/K2RN1RB w - - 0 1', 'eval': 108 },
        { 'fen': 'rnkn4/qppp1ppp/b3p1p1/1r4b1/1Q4P1/P1R1NBP1/PPPPP3/BNR4K w - - 0 1', 'eval': 0 },
        { 'fen': 'n3rk1q/pp1pppb1/2pr1p1b/1n2p3/P1B3R1/NP3N2/PQPPPP1P/1R3B1K w - - 0 1', 'eval': -46 },
        { 'fen': '1r4kb/p2ppppp/brq3pp/n4n2/3PP2R/P7/BPPPP1P1/NBR2KNQ w - - 0 1', 'eval': 58 },
        { 'fen': 'kr4nn/pp1p1ppb/2p4p/b1pr3q/4BP2/3QP1R1/PPBPPPP1/K2R2NN w - - 0 1', 'eval': 0 },
        { 'fen': 'q1n3k1/pp1pppbp/b3rrpp/3n4/1P5B/B1RN1PP1/RPPPPN1P/K6Q w - - 0 1', 'eval': -22 },
        { 'fen': '6kb/rpnpppp1/p1nb3q/1p2p2r/N3R1B1/P3P2P/P2QPPPP/1R2K1BN w - - 0 1', 'eval': -2 },
        { 'fen': 'bk3r2/pppp1p1n/1r1npb1p/3p3q/1P6/PR3NR1/PPPPPP1B/1NK1Q1B1 w - - 0 1', 'eval': 56 },
        { 'fen': '1nq2k1r/pbpp2pp/3bpp2/1r1p1n2/B5N1/BPR2P1P/PNP1PPP1/3K2QR w - - 0 1', 'eval': 0 },
        { 'fen': 'kr1n1brq/pppp1ppp/3pn3/3b4/2R2P1N/1N1BP2P/PPP1BQPP/K3R3 w - - 0 1', 'eval': 67 },
        { 'fen': '1n1r2k1/pppqp1pp/2p2p2/r1bn1b2/2P5/4RNPP/PPPP1NPB/QKR4B w - - 0 1', 'eval': -11 },
        { 'fen': 'n2rn1k1/1p1ppprp/b1pp1pb1/6q1/6BN/2P3QR/PPPPPNPP/R2B1K2 w - - 0 1', 'eval': -59 },
        { 'fen': '4kr2/pp1pbppp/bqn1p1nr/2p5/8/PBP1NB1R/NP1PPPPP/K1RQ4 w - - 0 1', 'eval': 41 },
        { 'fen': 'b1k2bqn/nrppppp1/pp3p2/6r1/P1B3N1/PP2R1B1/P1PPP1P1/1Q1N1KR1 w - - 0 1', 'eval': 27 },
        { 'fen': '1b1nrn1k/1pp1qppp/pp4p1/r1b5/P1N5/2PB3P/QPPPPPN1/3RB1RK w - - 0 1', 'eval': -68 },
        { 'fen': '1b3kq1/pprppnp1/ppnr1b2/1p6/1N1P1B1P/PR2N3/2PPPPP1/K1R1B1Q1 w - - 0 1', 'eval': 43 },
        { 'fen': 'rk4qn/ppppp2p/p2rbbpn/8/1PN3P1/B3P3/RPPP1P1P/R3KQBN w - - 0 1', 'eval': 48 },
        { 'fen': '2k2rrq/1pp1pp1p/2nb1p2/pn2p2b/1P5N/PB4P1/PPPBRPP1/1RK3NQ w - - 0 1', 'eval': -9 },
        { 'fen': '1rnq2bk/ppprppp1/2pb3p/5n2/4N3/1P2RP1N/PPPPPBP1/Q1B3RK w - - 0 1', 'eval': 15 },
        { 'fen': '2q1b1k1/1p1pprpp/2rn2np/1p1b3p/R1N2R1P/BPN1P3/P1PPQ1PP/B6K w - - 0 1', 'eval': 0 },
        { 'fen': '1bqnk2r/pppp1pbp/3n2pr/p7/1N4PP/B1R1P3/PPP3PP/Q2KNR1B w - - 0 1', 'eval': 47 },
        { 'fen': '1rrn3k/p1p2ppp/n1bpp1q1/2pb4/B6P/N1NP1P2/1PPPP1P1/K1RBR1Q1 w - - 0 1', 'eval': -63 },
        { 'fen': '1bbkrr2/pp3ppp/1p1pn3/nq3p2/1B2R1P1/1B2NQPP/PPP1P2P/1R2K2N w - - 0 1', 'eval': -70 },
        { 'fen': '5kr1/r1p1pppp/2np1n1b/1pq2bp1/B5R1/P2QPP2/PP1P2PP/2NBRNK1 w - - 0 1', 'eval': -44 },
        { 'fen': '2kqb2r/2pppbpp/1p2nr1n/1pp5/1NP2N1R/4BPBP/PPPP1PR1/Q6K w - - 0 1', 'eval': -85 },
        { 'fen': 'nr2nk1q/b1ppbppp/p1p1rp2/8/8/PQ2RB1P/PPPP1PPN/BR4NK w - - 0 1', 'eval': 2 },
        { 'fen': 'kbq1n3/pp1pp2p/2p2bpn/pr2r3/1P6/RB1P3P/BPPNPPP1/QKN4R w - - 0 1', 'eval': -59 },
        { 'fen': 'rbr1qn1k/nppp1ppb/p7/1p4p1/NN6/P5P1/1PPPPP1P/K2BRBQR w - - 0 1', 'eval': -66 },
        { 'fen': 'rnkq4/1ppp1p1p/p1b2np1/pr2b3/R7/QPP5/PPPPPBP1/K1RN2BN w - - 0 1', 'eval': -49 },
        { 'fen': 'rknb1n1b/pppppqpp/3p4/7r/1P2PNN1/Q2P4/PPRBP1PP/5KRB w - - 0 1', 'eval': 0 },
        { 'fen': '1q2nrk1/nppp2pp/b1p1p1b1/rp6/4NP1R/3PPB2/PPP1RPPB/5KQN w - - 0 1', 'eval': -69 },
        { 'fen': 'k2rbrq1/ppp1npp1/2p1p1p1/1n4b1/2NP4/1R1P1B2/PP2PPPP/1N1KBQR1 w - - 0 1', 'eval': -7 },
        { 'fen': '2r1n1bk/1qpppppp/2p2p2/r3b2n/P7/1BN2P1B/PPPRPPPR/2NK1Q2 w - - 0 1', 'eval': -27 },
        { 'fen': '1qk2rnn/pb1ppp1p/1p2pbpr/8/RPP5/BP6/PR1PPP1P/1BNK1N1Q w - - 0 1', 'eval': 0 },
        { 'fen': 'n1br3k/1ppp1p1p/p4n1r/4ppqb/1P6/4NP1P/PRPRPPP1/1KQN2BB w - - 0 1', 'eval': -13 },
        { 'fen': '1q2rrk1/pp1pp1bp/b4pnn/2p3p1/N1P5/2PB2RP/1RPPPPP1/K2NB2Q w - - 0 1', 'eval': 0 },
        { 'fen': '2k5/pbp1qppp/b2rnr1p/2n2p1p/1N6/QP2PPR1/1P1PP1PP/R1N1KBB1 w - - 0 1', 'eval': 0 },
        { 'fen': 'r2nbbkq/pppp2pp/nr1p4/7p/R2NB3/PN3PBP/PRP1P1PP/Q5K1 w - - 0 1', 'eval': 27 },
        { 'fen': '3kb1bn/p1nqpppp/r1pp2r1/6p1/8/PP1P1N2/1PPPPBP1/BQK1R1RN w - - 0 1', 'eval': -4 },
        { 'fen': 'bnkr3b/p1ppqpp1/1p2p3/3p2rn/PR4N1/B1PP4/2PPP1PP/K1Q2RBN w - - 0 1', 'eval': 0 },
        { 'fen': 'n3k1nb/ppp1ppp1/pq4br/3p1r2/6R1/NPPP2B1/PNP1RPPP/QBK5 w - - 0 1', 'eval': 16 },
        { 'fen': '4knnr/1ppbqppp/2p1bpr1/p7/P2R1NBB/QP1P4/R1PPPP1P/1NK5 w - - 0 1', 'eval': -16 },
        { 'fen': '2rqbnkr/1p1ppp1p/2p1p1p1/3b3n/2N5/2RPN1P1/1PPPP1PP/1BQRB2K w - - 0 1', 'eval': 34 },
        { 'fen': '1n1qbk2/1p1prppp/1ppr2bn/4p3/1PB4N/4P1NP/P1PPP1P1/1K1R1BQR w - - 0 1', 'eval': -75 },
        { 'fen': '1b3q1k/2pprppp/ppnb3r/4n1p1/3P4/P1N1PRNB/1PPP1P1P/1B3RQK w - - 0 1', 'eval': -69 },
        { 'fen': '1k2qrr1/p3pppp/1nppbn2/4p2b/P6P/B1NPR3/BPP2PPP/K2N2RQ w - - 0 1', 'eval': -7 },
        { 'fen': '1b1k2n1/qp1pp1pp/2n1rb1p/1p1r1p2/PN4P1/1P5N/1QPPBPPP/4RRKB w - - 0 1', 'eval': -36 },
        { 'fen': '1nq1nkbr/2pppppp/r1p3p1/7b/2R1N3/QBR1N2P/PPPPPP1P/1K5B w - - 0 1', 'eval': 55 },
        { 'fen': '1rb4k/rp1ppppn/qn2p2p/b3p3/4R1P1/1B2NPN1/P1PPP1PP/B4RKQ w - - 0 1', 'eval': -53 },
        { 'fen': '1kb1rrq1/ppp2p1p/3np2n/2pbp3/4B3/PNR2NPP/PPRP1PP1/2KB3Q w - - 0 1', 'eval': -67 },
        { 'fen': '2k4r/pqp1pppb/p1bp1rn1/1n2p3/1P1R4/NN2B1P1/PPP1PP1P/2B1KQR1 w - - 0 1', 'eval': 0 },
        { 'fen': '2n1kqn1/bppp1p1p/1r4p1/1rp1b2p/1P6/1P1BBPN1/1PPPP1P1/NR3QRK w - - 0 1', 'eval': 0 },
        { 'fen': '3nq1k1/rbppppbp/1p3p1n/3p3r/1N6/1PRB2P1/PP1PPP1P/2NB1RQK w - - 0 1', 'eval': 99 },
        { 'fen': 'qk1b2b1/r1ppp1pp/1p1p1pn1/3nr3/3B2P1/1B1PN3/PPPR1PPP/1Q3KNR w - - 0 1', 'eval': 57 },
        { 'fen': '1rkn3q/p1ppb1pp/1r2pp1n/3b1p2/1P2B1QP/2N1P1R1/PPPP2NP/4KRB1 w - - 0 1', 'eval': 0 },
        { 'fen': 'k2qbb1r/p1p1ppp1/5pnp/1n4rp/6R1/2RPP1N1/PPPN1PPP/QBK4B w - - 0 1', 'eval': -61 },
        { 'fen': '1k1brnrq/bpp1ppp1/1p1p4/3n2p1/1PN5/RP2P3/B1PBPPPP/KQ2R2N w - - 0 1', 'eval': 53 },
        { 'fen': 'n3rk2/ppppbpr1/1q2p1p1/nb1p4/3BB3/P1P4P/NQPP1PPP/NKR4R w - - 0 1', 'eval': -27 },
        { 'fen': 'n3b1kr/1ppbppp1/n2pq2r/1p2p3/1P3RR1/1NP5/PP2PPPP/BBKQ2N1 w - - 0 1', 'eval': -35 },
        { 'fen': 'kr5q/1pppbppp/3p1n1n/rp2b3/4QR1B/2N2PB1/PPPPP1PP/2N3KR w - - 0 1', 'eval': 68 },
        { 'fen': '1nnk3q/ppbp2pp/rpp3bp/1r6/5P2/2PRB1P1/PP1PPPR1/KB1NNQ2 w - - 0 1', 'eval': -7 },
        { 'fen': '1kbq1n2/2nppppp/p1p1b1r1/1p5r/8/N2RPPPB/1PPP2PP/BKN1QR2 w - - 0 1', 'eval': 0 },
        { 'fen': '1b1k3r/2pppnpp/p1p1bpqr/5n2/N7/BPRP2P1/P2PPRPP/KN4BQ w - - 0 1', 'eval': 0 },
        { 'fen': 'br1kq2b/p1p1pppp/3rp3/pn3n2/2B5/2RP3P/QPPP1PPP/1K1BRNN1 w - - 0 1', 'eval': -52 },
        { 'fen': '1nbk3r/ppp2ppp/2ppb2q/4r2n/1RP5/1P1BN2P/PB1PPPQP/4KRN1 w - - 0 1', 'eval': 0 },
        { 'fen': 'nb1knq1r/ppp1ppp1/bp5r/1p6/3PB2N/3P1R2/NPPP1PPP/1QK1B1R1 w - - 0 1', 'eval': 66 },
        { 'fen': '2k1rrb1/1pqpp1pp/pbp1p3/3n1n2/5Q2/3PPRNP/PBPP1PPN/1KB1R3 w - - 0 1', 'eval': 0 },
        { 'fen': '1brkq1r1/1pppbppp/p1p1n3/3n4/N3P1Q1/P3RPN1/PPP1P2P/1RKB1B2 w - - 0 1', 'eval': -62 },
        { 'fen': 'nr1q1k1b/1pppppnb/4r1p1/4p1p1/2N2P2/PR2Q2P/P1PPBPP1/R1N2BK1 w - - 0 1', 'eval': -3 },
        { 'fen': '2r4k/bp1ppqpp/5p2/nbprpn2/PN1QN2P/2RP1R2/PPP1BP1P/2B3K1 w - - 0 1', 'eval': 96 },
        { 'fen': '1r2b1kr/bpn1pppp/pq1pn3/4p3/P4P2/1P2NRB1/2P1PPPP/1N2RKBQ w - - 0 1', 'eval': -51 },
        { 'fen': 'qrb1nkn1/pp1pppp1/2r4p/1p5b/5RN1/2P1BNP1/1PPPPP1P/3KRQ1B w - - 0 1', 'eval': -45 },
        { 'fen': '1nrqk3/prppp1np/1pbb2p1/1p6/3P4/R3RPP1/NPPPPQP1/B1K3NB w - - 0 1', 'eval': 0 },
        { 'fen': 'n5k1/pp1rpppp/bbpp3n/2q4r/R1P3N1/P1BQ3P/2PPPPNP/4B1KR w - - 0 1', 'eval': 17 },
        { 'fen': 'b1rrk1n1/pnppp2p/b4pp1/2p3q1/1P6/1PP3Q1/PNBRPPPP/N3KBR1 w - - 0 1', 'eval': 3 },
        { 'fen': 'b2nbkr1/1p1pp1pp/prp3p1/1q1n4/1P5N/1N3PP1/1P1PPPP1/QB1KBRR1 w - - 0 1', 'eval': 0 },
        { 'fen': 'k1nnq2b/pr1p1ppp/b1ppp3/3r4/BP2R3/2P2N2/PPP1PNPP/QRB2K2 w - - 0 1', 'eval': 30 },
        { 'fen': 'k2n4/nprqpppp/pb1r2pp/7b/3P3B/1NPQ1R2/PRPP1PPP/K2B3N w - - 0 1', 'eval': -23 },
        { 'fen': '5bkq/rnpppppp/r2ppb2/1n6/2P2R2/R1BP3P/PNPPP1BP/1QK4N w - - 0 1', 'eval': 10 },
        { 'fen': 'kq2r3/pp1brppp/pn1p4/bp1n4/2P2P2/1PB2Q2/P1P1PBPP/N1RNK1R1 w - - 0 1', 'eval': 65 },
        { 'fen': 'nnb3kr/ppbpp1p1/1p1rqp2/p7/P1R5/NPR2P2/PPP1B1PP/1QK1NB2 w - - 0 1', 'eval': -79 },
        { 'fen': 'rk1br1qn/2ppppnp/1b2p1p1/3p4/1P6/NB1NRP2/PPPPP2P/Q1BR1K2 w - - 0 1', 'eval': 0 },
        { 'fen': '1qk1b1n1/bppp1rpp/p3r1n1/p6p/1PP5/1RPBBR2/PP2P1PP/NK1Q2N1 w - - 0 1', 'eval': 73 },
        { 'fen': '1kbrq2n/2pbpppp/p1p4n/6pr/2P4B/RP2P3/PBPPPNRP/1NQ3K1 w - - 0 1', 'eval': 0 },
        { 'fen': '1qbk4/pnpprppp/3rb1pp/3n4/P2R1B2/3P2N1/PPPP1NPP/2Q1B1KR w - - 0 1', 'eval': -40 },
        { 'fen': '1q2k3/pbbppppr/3p1rnn/1p4p1/P3PN2/5BP1/1PPPPBQP/2K1NR1R w - - 0 1', 'eval': 34 },
        { 'fen': '1bkr4/pp3ppp/1n2rqpb/p2n3p/2N3P1/Q2BPBRR/1P1PPPPP/N2K4 w - - 0 1', 'eval': 0 },
        { 'fen': '2b1bk2/pp1pp1pr/nqpp3r/1n4p1/2P4B/P1P1N2B/1P1P1PPP/1NR1K1RQ w - - 0 1', 'eval': 0 },
        { 'fen': '2nk1bn1/pp2pprp/1rp2bq1/2pp4/N6R/2B2P1P/PPPNPP1P/1R2BQ1K w - - 0 1', 'eval': -41 },
        { 'fen': 'qr3k2/p1pp1ppb/3pp1rn/1pn1b3/3N4/RP1P2BP/P2PPQPP/1NKB2R1 w - - 0 1', 'eval': -3 },
        { 'fen': '1r3k1b/ppppq1pp/2n2ppr/4b1n1/PP1QR3/1NN4P/PBPPPPR1/3KB3 w - - 0 1', 'eval': -50 },
        { 'fen': 'qrk3nn/p2ppppp/p1bp1r2/6b1/1Q5P/RPP1R3/P2PP1PP/B2NKBN1 w - - 0 1', 'eval': 80 },
        { 'fen': '1b1rnb1k/ppnp1ppp/p1r2pq1/8/5B2/P1P1P3/NP1PPPNP/2BQ1RRK w - - 0 1', 'eval': 51 },
        { 'fen': '2k2r1q/ppppn2p/1pp1brp1/2bn4/4P2P/1Q3P1N/PPBPPRPR/2B1K1N1 w - - 0 1', 'eval': 0 },
        { 'fen': '1bnnkrq1/pr1pbppp/1p1p4/1p6/PP5R/1Q4NP/P1P1PPPN/K1R1B2B w - - 0 1', 'eval': 0 },
        { 'fen': 'n1krn1rq/1pb1pppp/2pp2p1/7b/8/3PPNP1/PPP1PBPQ/N1K1RBR1 w - - 0 1', 'eval': -74 },
        { 'fen': 'r1bnk3/p1rqpppp/p4b1p/3p1n2/4N3/B2P2P1/1PPPPPRP/B1KQRN2 w - - 0 1', 'eval': -36 },
        { 'fen': '2q1k1r1/pppp1ppb/b2np2n/p3r3/2R5/4BP1P/PPPPP1PN/1RQ1KB1N w - - 0 1', 'eval': 84 },
        { 'fen': '1k2n1rb/pppppb1p/3n2p1/1pr2q2/8/RP3PP1/PPPPNPBB/R1QN1K2 w - - 0 1', 'eval': 18 },
        { 'fen': 'n1k1bqb1/rpp1p1pp/p3np2/2p3r1/4PR2/1PP2BN1/PQP1PPP1/B1K1N1R1 w - - 0 1', 'eval': 22 },
        { 'fen': '1rk2rbb/1ppp1ppp/2p3pn/n2q4/3B4/P2P4/PPQ1PPPP/1BN1KNRR w - - 0 1', 'eval': 52 },
        { 'fen': 'rkb1rq2/1ppp2pp/b2npn2/4p1p1/2P5/PB1PB3/NPPP1PP1/QRKNR3 w - - 0 1', 'eval': -15 },
        { 'fen': 'b2k1nbq/prpppnpp/1p3r1p/8/P1R4P/P7/B1PP1PPP/1KQNNR1B w - - 0 1', 'eval': -39 },
        { 'fen': '2nrrbkb/1p1pppp1/2p1q2n/1p3p2/2P4P/1PB1Q2R/NPPP1PP1/1NBR3K w - - 0 1', 'eval': 62 },
        { 'fen': 'kqbnb1n1/pppp1p1p/1rp1p3/7r/1B3PN1/2P1RPR1/PPBPPP1N/4K2Q w - - 0 1', 'eval': 62 },
        { 'fen': 'knrn1bbq/p1p1pp1p/pp3p2/r7/2Q1N3/N2BPP2/PPPPP1P1/R2BR2K w - - 0 1', 'eval': 39 },
        { 'fen': '2rbk3/pp1pp1rp/2np1p1b/3npq2/1P1R1R2/2Q2PNN/1PPPP1PP/K1B4B w - - 0 1', 'eval': 0 },
        { 'fen': 'k7/p1nppppb/q1pnrr2/p1p3b1/4Q1P1/PP4B1/1PP1PP1P/B1NN1KRR w - - 0 1', 'eval': 63 },
        { 'fen': 'nkn1q1b1/r2ppppp/1pppbr2/8/1B6/PNRPN1P1/BPP1PPP1/1K2Q2R w - - 0 1', 'eval': -110 },
        { 'fen': 'r3bkrq/np1pnppp/p3b2p/5p2/4RN2/PPP4B/PP2PPP1/RNB1Q1K1 w - - 0 1', 'eval': -34 },
        { 'fen': 'kqb5/r1p1pppp/2pn2pn/r4b1p/8/NP1PP3/PPP2PNP/Q1BBRK1R w - - 0 1', 'eval': 101 },
        { 'fen': '1b2qbk1/npp1pppr/p3p1np/7r/1PR3N1/QN2BP1P/1PPP1PP1/B2KR3 w - - 0 1', 'eval': 39 },
        { 'fen': '1k1rnr2/1ppbpppq/pp4n1/1b1p4/5P2/Q1PR2BN/PRPPPPPB/K4N2 w - - 0 1', 'eval': 41 },
        { 'fen': 'rkq2brb/pppn1p1p/3pn3/3p3p/B1P1P3/PR2Q1B1/PP1PPNRP/2K2N2 w - - 0 1', 'eval': 21 },
        { 'fen': '4k1b1/pp2pnpp/bqp2p1n/2p1rr2/5N2/PP2R1B1/PPPPQ1PP/1N1K1B1R w - - 0 1', 'eval': 73 },
        { 'fen': '1n1nkr2/pppp2pp/2b1qp1r/bp6/2QP2B1/RR1P2P1/2PPPP1P/K1B2N1N w - - 0 1', 'eval': -61 },
        { 'fen': 'kr1b1b2/pp3ppp/1rn1p1pq/2np4/1P6/N2BP1RP/PRPP1P1P/NQK3B1 w - - 0 1', 'eval': 65 },
        { 'fen': '1n2bqkr/p3pppp/1pprn3/p6b/1RR1P2Q/3P2PB/PNPBPP1P/1N5K w - - 0 1', 'eval': -63 },
        { 'fen': '3rn1kn/rpp1pp1p/p1bb2pp/1q6/8/PPB1N1NB/RPPPPP1P/1Q1R1K2 w - - 0 1', 'eval': -49 },
        { 'fen': 'kn1rbr2/pp1ppn1p/5bpq/2p2p2/1N3P2/2BB2P1/PPPPP2P/1R1Q1KNR w - - 0 1', 'eval': 0 },
        { 'fen': 'k1nr1q1r/ppp1pp1p/2bnb1p1/1p6/P1R5/1PB1R1P1/2PPPPPN/N2Q2KB w - - 0 1', 'eval': 0 },
        { 'fen': 'r3rk1n/1ppp1bpp/n2q1pp1/4bp2/3P1PQ1/3B1P1R/PPPPPB2/3RKN1N w - - 0 1', 'eval': 0 },
        { 'fen': 'q1k4b/pp2pppp/r1pbp2n/1n2r3/3Q2R1/3PPRBP/1PP1PPP1/3NBK1N w - - 0 1', 'eval': 47 },
        { 'fen': 'b1b2knr/ppprppqp/2p1n3/2p5/7N/NBP4P/P1PPPPPR/K2R1B1Q w - - 0 1', 'eval': 73 },
        { 'fen': 'b2rk1b1/p1qppprp/3p4/2n1p1np/P7/Q2P2B1/PPPN1PPP/R3RBKN w - - 0 1', 'eval': 3 },
        { 'fen': '1r1bkn1b/p1np1ppp/3qp2p/3r1p2/3B4/1P1B1PQ1/P1PPRPPP/NK1R2N1 w - - 0 1', 'eval': 49 },
        { 'fen': '2bkn3/p1pppppr/1pb1qr1p/5n2/BPN5/1PRBP3/P1PPP1P1/1Q1R1N1K w - - 0 1', 'eval': 51 },
        { 'fen': '1b1nrknr/pp1ppp2/p5qp/pb6/R3Q1P1/PPN2B2/P2PP1PP/N1R2K1B w - - 0 1', 'eval': -24 },
        { 'fen': '1q4rk/pbpppnpp/3pp1nb/3r4/2N2B2/Q1B1N1PP/PPPPPPR1/R3K3 w - - 0 1', 'eval': -72 },
        { 'fen': '2n2kbb/pprp1ppp/7p/1n1pqr2/8/PP2QR1R/BPP1PPPP/N1NK1B2 w - - 0 1', 'eval': 0 },
        { 'fen': 'k1b1nbr1/ppppp2p/rq4p1/1p3n2/1P3P1B/3N2P1/RPPPPRBP/2NK2Q1 w - - 0 1', 'eval': -29 },
        { 'fen': '1r1kqn1n/1pbp1ppp/p1p2p2/4r1b1/4NR2/1R1PQPB1/PPNPP1PP/B6K w - - 0 1', 'eval': -67 },
        { 'fen': '2r2kb1/rpp1pppn/2qpn2p/3b1p2/3R2N1/3QNP2/PPPPRPPP/B3B1K1 w - - 0 1', 'eval': -72 },
        { 'fen': '1b5k/np1ppnpp/p3q3/1rp2brp/8/3PB1PP/PPBPPNPR/R1QKN3 w - - 0 1', 'eval': 42 },
        { 'fen': 'qb2n2k/ppp1rp1p/n2prbp1/p7/1P6/1B1RP3/PPPQPNPP/RB2KN2 w - - 0 1', 'eval': 0 },
        { 'fen': 'r1k2n1r/pbpp1ppq/4p3/2pnpb2/8/NP1P2PB/PPP1PQBP/1RRN1K2 w - - 0 1', 'eval': -76 },
        { 'fen': '1qnbkr1r/p1ppppp1/p2b4/4np2/5R2/4PPPN/QP1PP1PP/1KRN1B1B w - - 0 1', 'eval': -93 },
        { 'fen': 'bb3kq1/prnpppp1/4r2p/2n2p1p/B3P3/1P4BP/PPPP1RP1/1QNKRN2 w - - 0 1', 'eval': 22 },
        { 'fen': '2rkb1n1/1ppppbpp/2p4q/n2r2p1/P2PB3/4P2B/PPP2RPP/NR1K1NQ1 w - - 0 1', 'eval': -53 },
        { 'fen': '1bbkn1q1/ppppr2p/3ppr2/5n1p/2B1P3/1QPR3P/1P1PPP1P/NR1K2NB w - - 0 1', 'eval': -25 },
        { 'fen': '2n1k1r1/pppr1ppp/2p1q1pb/5nb1/2P5/2R1PRP1/P1PPQPPB/N1KB3N w - - 0 1', 'eval': -73 },
        { 'fen': 'krnqb3/ppppp2p/3b2p1/n2p3r/1NP4R/P1P2QBN/P1RPP1PP/3KB3 w - - 0 1', 'eval': 75 },
        { 'fen': '1q1b2k1/1p1ppprp/3nb1p1/np1pr3/B3QR2/1P2PNP1/1PPPPP1B/K2RN3 w - - 0 1', 'eval': 0 },
        { 'fen': '2k1bnn1/pppbpr1p/p1q3p1/pr6/B5PR/1RP4N/N1PPPPPP/B2KQ3 w - - 0 1', 'eval': -42 },
        { 'fen': 'n2k1q1n/ppppr1pp/5p2/r1b1b1p1/2R2NRP/5PP1/1PPP1P1P/B2QNKB1 w - - 0 1', 'eval': 81 },
        { 'fen': 'n1q1bk2/rppp1pp1/2n1p3/3pbrp1/3RB3/PQ1NP2P/RPPPBNPP/6K1 w - - 0 1', 'eval': -10 },
        { 'fen': '2qkn3/rppprpp1/b1p4b/p4pn1/N3P1B1/1P1RP3/1NPPPQPP/R2K2B1 w - - 0 1', 'eval': 79 },
        { 'fen': '3bq1nk/p1rp1ppp/1pr1b2p/6np/1BR2Q2/1PP4P/PNPPPNPR/4K1B1 w - - 0 1', 'eval': -84 },
        { 'fen': '5rk1/pppnppbp/n1r2qpb/1p6/1NP5/2P1R1P1/PPR1PBPP/4NQKB w - - 0 1', 'eval': 0 },
        { 'fen': '3rnqbk/ppppppn1/3p2rp/5b2/P7/1P1PR3/PPP1PPQN/BBRKN3 w - - 0 1', 'eval': 78 },
        { 'fen': 'qr2bn1k/2pp1ppp/pp2b3/1r2p2n/3P4/2P1PR2/PP1P1BPP/NBKQ2NR w - - 0 1', 'eval': -1 },
        { 'fen': '4k2r/1ppbp1pp/q2p3r/1p1n1pnb/B1QP4/1P1P1N2/PBPNRPPP/3R1K2 w - - 0 1', 'eval': -15 },
        { 'fen': '4kbrn/pq1p1ppp/r1p4p/1bnp4/8/1BR1PRP1/PPP1PPNP/1K1Q2NB w - - 0 1', 'eval': -97 },
        { 'fen': 'r1r1qkn1/pp2pppp/p1p1n1b1/6b1/B4P2/1P3P1R/PPP1P1QP/B1NR1N1K w - - 0 1', 'eval': 19 },
        { 'fen': 'k2bnq2/pn1ppppp/2prr3/4p1b1/4B3/NR4PP/PPPPP2P/Q1RNK1B1 w - - 0 1', 'eval': 0 },
        { 'fen': '1r5k/1pppbppq/2p1prn1/3p1nb1/3R3P/B3PQP1/PPP1PPN1/B1KN2R1 w - - 0 1', 'eval': 0 },
        { 'fen': '3nbk2/pppn1rpp/1pb2p1q/1p5r/5PR1/P2NQ3/1PPPPPRP/KNBB4 w - - 0 1', 'eval': 0 },
        { 'fen': 'rqb2kn1/ppp1pbpp/2r1p1n1/3p4/1PN4B/3P3Q/PPNRPPPP/2B2RK1 w - - 0 1', 'eval': 47 },
        { 'fen': 'b2r1nk1/ppnrpppp/bqp1p3/8/8/3RPN1P/1PPPPP1P/QB1BNR1K w - - 0 1', 'eval': 0 },
        { 'fen': 'n1b2r1k/1pppqp1p/2rppp2/2n4b/1B6/PP2N1QP/RP1RPPPP/2BKN3 w - - 0 1', 'eval': 0 },
        { 'fen': '5r1k/prp1pppp/1pnbpn2/1q4b1/R3Q3/2P3PB/PPNPPPP1/N3KB1R w - - 0 1', 'eval': 20 },
        { 'fen': '2bk1rbq/pppn1p1p/3p1n2/1p1p2r1/1PQ5/R1PN1RP1/P3PPPP/K2NB2B w - - 0 1', 'eval': 0 },
        { 'fen': 'kr1q1rn1/pp1pp2p/p1n2bp1/1pb5/2QP2PN/B2PN3/1P2PPPP/R2RK1B1 w - - 0 1', 'eval': 49 },
        { 'fen': 'krb1q2b/pppppp2/pr4p1/n2n4/8/P1PR1PBN/P1P1PRPP/BQN1K3 w - - 0 1', 'eval': 27 },
        { 'fen': 'krn2r2/1pppbpp1/bpq2p1p/2n5/1B6/NQRPP3/PP1RPPPP/2BN1K2 w - - 0 1', 'eval': -21 },
        { 'fen': '2k3bq/rpp1pppp/rnbp2n1/6p1/1P1P3Q/N6P/PPP1P1P1/RRK1NBB1 w - - 0 1', 'eval': 64 },
        { 'fen': 'rn1r1kn1/p1p1ppbp/1q1p2p1/2p1b3/BPP3N1/P4RR1/1PQPP1PP/3BKN2 w - - 0 1', 'eval': -40 },
        { 'fen': 'b1bkn3/ppqpppp1/1p3r1p/2r1n3/P7/P1P1NB2/P1NP1PPP/1B1RKQ1R w - - 0 1', 'eval': 28 },
        { 'fen': 'b1q1rk2/ppnppp1p/2p1r1n1/2p3b1/8/NP1PRP2/3PPPPP/Q1N1BBKR w - - 0 1', 'eval': 19 },
        { 'fen': 'k1q2r1b/n1pppp1p/3b1rp1/3n1pp1/B2R1P1P/Q5P1/PPPP1P2/2KNRNB1 w - - 0 1', 'eval': 0 },
        { 'fen': 'nkq3r1/pnpppppp/5pr1/1bb5/3B4/PN1R1P2/PPPP2PP/BQ1KR2N w - - 0 1', 'eval': -27 },
        { 'fen': '2k1q3/pppppbpb/3np2p/5rrn/6R1/N2P1R1P/1PBPPPPP/N3BKQ1 w - - 0 1', 'eval': 0 },
        { 'fen': '1rk2r2/1ppppnpp/p1p2qn1/1b3b2/3N1P2/P3P2R/PPP2PPN/1R1BBQK1 w - - 0 1', 'eval': 54 },
        { 'fen': '1nk5/prp1pppb/p1rpbq2/3p2n1/3P1RR1/P1NQP3/P2PBPPP/K1N3B1 w - - 0 1', 'eval': -37 },
        { 'fen': '2krrnnb/1pppp2p/2p2pbp/3q4/N2P3P/4P1Q1/PP2BPPP/1BNKR2R w - - 0 1', 'eval': -40 },
        { 'fen': '1nq2rk1/pp2ppp1/1b1p1r1p/2npb3/2B2RP1/P3P2N/1BPPPPNP/1R1Q3K w - - 0 1', 'eval': 0 },
        { 'fen': '1n1kb2n/pp1rppp1/3p2pp/b5rq/2BP4/P1RP1R1Q/1PP1P1PP/KN3N1B w - - 0 1', 'eval': -49 },
        { 'fen': 'bbknrr2/q1ppppp1/5pnp/5p2/1N3R2/PN1PQ2P/PP2PP1P/2KBR1B1 w - - 0 1', 'eval': 28 },
        { 'fen': '1kn5/pp1rppbp/pq1b2nr/1p4p1/1PB4R/4P1P1/NPPP1P1P/1RB2QKN w - - 0 1', 'eval': 0 },
        { 'fen': 'qnr1r2k/bpppppp1/2bp4/4np2/2N5/PN1RP1P1/1PP2PPP/R3QBBK w - - 0 1', 'eval': 83 },
        { 'fen': 'bq2nk2/pp1pppp1/1np1r3/rb2p3/2Q4P/N2BP3/PPPPBNPP/RK1R4 w - - 0 1', 'eval': 0 },
        { 'fen': 'q2nb2k/ppppprr1/2p2pb1/3pn3/1R6/1NBQPPPB/1PNPPRPP/2K5 w - - 0 1', 'eval': -12 },
        { 'fen': '2r1b1bk/pnp1pqpp/4pp1p/2n2r2/PN6/3P3P/PPQPPPNB/3BR1KR w - - 0 1', 'eval': 45 },
        { 'fen': '1r1kq1b1/b1ppppp1/n2n2pp/2p2r2/3QNP2/P4P2/PPPP2PB/R1N2KRB w - - 0 1', 'eval': -34 },
        { 'fen': '1k1qn3/pppp1rpp/1b2npb1/r4p2/P3N2P/1B1P3N/P1PBPPP1/Q1K1RR2 w - - 0 1', 'eval': 74 },
        { 'fen': '1k1r2b1/pp1pppq1/2ppr2p/nn4b1/3R3B/QN1PRP1N/BPP1PPPP/1K6 w - - 0 1', 'eval': 0 },
        { 'fen': '3k2n1/p1pp1ppr/q1n1pbr1/3bp1p1/4NN2/1P1P1P1B/BPPP1RPP/1R1Q3K w - - 0 1', 'eval': 0 },
        { 'fen': 'k2rnqn1/p1p1p1pp/3r1ppb/3p3b/6B1/P4BP1/QP1PPPPP/NRK1RN2 w - - 0 1', 'eval': 70 },
        { 'fen': 'n2k4/pnrppp1p/1pb2p2/brp5/P5q1/1PR1P1B1/N1PPPPP1/BQR1K3 w - - 0 2', 'eval': 23 },
        { 'fen': '1k4Nb/p1p3p1/pr1pn1pp/1n6/2q3N1/4P1PP/PP1rPP1R/4RQBK w - - 1 4', 'eval': -27 },
        { 'fen': 'k3qnb1/pp1p1rpb/2p1rnp1/2p5/2P2N1P/N1P3P1/PQRPPR2/2BK1B2 w - - 1 2', 'eval': 0 },
        { 'fen': 'n1bqn2k/2prpprp/bp2p2p/8/1Q2P2P/BP2RP2/PRN1BNPP/2K5 w - - 2 2', 'eval': 33 },
        { 'fen': '1r1nkn2/1p1pbp1p/1rp1p1pb/7q/P6P/1PNP4/R1P1NPP1/BQBRK3 w - - 1 2', 'eval': -34 },
        { 'fen': '1r2nq1k/ppppn2b/pr3p2/b1p5/8/PP3PR1/1PPR1BPP/1B2KNQN w - - 0 2', 'eval': 3 },
        { 'fen': 'k1r3nb/p4pbp/r2p3n/1pp4p/3P4/3P1NPP/P1P2P2/R1B1BKNR w - - 2 3', 'eval': -2 },
        { 'fen': '1kr4r/pq2pnpp/pppbb2n/8/7B/3QPB1P/1PPP1PP1/KRN1NR2 w - - 2 2', 'eval': -16 },
        { 'fen': '2bkq3/2npp1n1/p5pp/3pr1p1/7P/N1PP4/PP1BbP2/BRK2R1Q w - - 1 4', 'eval': -10 },
        { 'fen': '2k2rn1/1bqprppp/p1p1n2p/8/2PQ4/1R2B1PP/PP3PBP/2N3NK w - - 1 3', 'eval': 15 },
        { 'fen': 'k3bn2/ppp2r1p/3bpp1r/2B5/q4p2/P2P1P2/2PPP1RP/R1KN2QN w - - 1 3', 'eval': -9 },
        { 'fen': 'q1r1k1nb/bp1prn2/5p1p/p5p1/P4p2/1N1P2PR/1PBNPP2/RB1KQ3 w - - 0 4', 'eval': 25 },
        { 'fen': '1rk2n2/1p3ppp/2pbpb1q/1n6/R2P3P/1BP1P3/P2QNPr1/1NBK1R2 w - - 1 4', 'eval': 14 },
        { 'fen': '3n1rkb/bpr1p1pp/pn1q4/1p5p/3P3P/2P1P3/P1BN1P1P/Q1R1KRNB w - - 1 4', 'eval': 30 },
        { 'fen': 'n1r1n2k/bpp3pp/p3b3/qp4p1/4r1P1/P4B1P/PPP1NP2/BQNR3K w - - 0 4', 'eval': 12 },
        { 'fen': '3b3k/q1ppp2p/p1b2p1n/5prN/8/PrPPPP2/1P1Q2RP/RK2NB2 w - - 2 4', 'eval': 4 },
        { 'fen': '4bk1r/b2ppr2/pppq2p1/2nP1p2/P1R3BP/N2B1RP1/2P1PPQ1/6KN w - - 0 5', 'eval': -13 },
        { 'fen': 'n3qrkb/p1npbp1r/2p1p1p1/2p5/7P/BPP3PN/P2RQP1P/B1N2K1R w - - 2 3', 'eval': -25 },
        { 'fen': 'nk1b3n/1pp1pr1p/p1b3p1/r2p4/3P2N1/2PN2qP/P1RP1PP1/B1BR1KQ1 w - - 2 2', 'eval': 15 },
        { 'fen': '2nkq1b1/pbp2rp1/3r1p2/p3p1p1/4P3/1NRP2P1/2PPP2P/2BNK1BQ w - - 2 5', 'eval': -25 },
        { 'fen': 'rnn1bk2/3ppppq/1p2pr1p/4N3/3N1P2/1P1P2P1/P1PQR1P1/1K1B1B2 w - - 1 4', 'eval': 12 },
        { 'fen': 'rk2qbnn/p3p3/1bppp2r/2p5/5PPN/1P4P1/1PPRP2B/K2R2BQ w - - 1 4', 'eval': 27 },
        { 'fen': 'r3bnb1/ppp1p1nk/rq1pp1pB/8/7P/N4PPP/PPB1PQN1/1R2K1R1 w - - 6 4', 'eval': 32 },
        { 'fen': '2r3k1/qp1np1p1/bnpp2Np/4rb2/P2Q1Np1/PPB4P/BP2PP2/K1R5 w - - 4 5', 'eval': 34 },
        { 'fen': '3nkb2/1q3prr/pp1bp1p1/1p6/3R4/P1P1P1P1/3PBP1P/NKN3RQ w - - 0 5', 'eval': 34 },
        { 'fen': 'qknr1nb1/2p2rp1/pp2p2p/1p4b1/1P4R1/1B1PPP2/PP1QB2P/NK4NR w - - 0 2', 'eval': 33 },
        { 'fen': '3k1n2/pbppp2p/1p2q1r1/4pnb1/1N6/1P1BP1RP/P1P1NPP1/QR2K3 w - - 0 3', 'eval': 24 },
        { 'fen': '1q3kb1/3prpnp/1bprp1n1/p3p3/R7/PP1N1P2/NP2P2P/B1BQ1R1K w - - 2 5', 'eval': 6 },
        { 'fen': '1nnk1q1b/rpRp1pr1/p5pb/8/4pN2/P2NPB1P/P1PP4/1BQ1RK2 w - - 1 3', 'eval': -4 },
        { 'fen': 'nbb4k/1pppprp1/p1q3p1/5r2/1P3n2/1N1N1PPP/RPPQP1BB/3K4 w - - 0 2', 'eval': -31 },
        { 'fen': 'n1knb2q/p4pp1/pp1p4/3pr3/B4P2/P1P1P3/Q1N1P1PP/BKN5 w - - 1 4', 'eval': 7 },
        { 'fen': 'nq1bkn2/p3pb2/1pr2p1p/3pp3/8/1PPPQ2B/BN2PPPP/R1NK4 w - - 0 3', 'eval': 30 },
        { 'fen': 'kr4nb/1q2ppp1/pnpp2p1/3r4/1PP5/N1RPBbBP/P4PP1/2N2QK1 w - - 0 3', 'eval': 29 },
        { 'fen': '4rk1n/pppr1pp1/4nbpq/3p3b/P1P3P1/1P2PP2/1R5P/NBBKRQN1 w - - 0 4', 'eval': 11 },
        { 'fen': 'bb1q3k/pp2p2r/1pp3p1/2p3n1/6Br/1PP1NPPP/R2PBP2/4QK2 w - - 0 3', 'eval': -27 },
        { 'fen': '2rn1k1n/1p3b1q/pprpp1bp/8/3B1p2/1PP4Q/P2BNPPP/N1R1KR2 w - - 0 5', 'eval': 9 },
        { 'fen': 'b4k1r/r2p1qpp/pp2p3/p2N2b1/P1n5/3PPP2/1PBP2PQ/B1KN4 w - - 0 4', 'eval': -30 },
        { 'fen': '1k2nn2/ppq2p1b/2p1p1r1/2pr1pbQ/B1N5/3PPBP1/PPNR1P1P/K4R2 w - - 2 2', 'eval': -29 },
        { 'fen': 'kb3b1q/pp1p3r/1np1np2/4P2p/6Q1/P5PR/2PP1P1B/N4RBK w - - 0 5', 'eval': -32 },
        { 'fen': '3k1q1b/pppr1p2/b2pn1pr/6n1/8/2NP3P/PPPPR1B1/NQBK1R2 w - - 0 5', 'eval': 33 },
        { 'fen': 'k1r2q1b/1rpbp1pp/1pp2n1p/n7/QP1N3R/P3P1P1/2NP2PP/RBK2B2 w - - 1 3', 'eval': 29 },
        { 'fen': '1brkqn2/r3p1pn/2pp1pb1/pP3p2/8/3PRN1P/PQP1PBPR/3N1K1B w - - 0 2', 'eval': 21 },
        { 'fen': 'k2bnn2/2rp1p1p/pp1q3p/p6r/7b/1PBPP1RP/NBPP1RPQ/3K2N1 w - - 2 2', 'eval': -12 },
        { 'fen': '4bk1q/rppbpp2/p1p4p/2n5/2PN3R/2PPP3/P2N1QP1/K3B3 w - - 1 5', 'eval': -7 },
        { 'fen': '2k1nbr1/p1ppn3/3pqpp1/pr4b1/6Q1/1P2NPPR/1PP1P2P/1NBBKR2 w - - 2 2', 'eval': 23 },
        { 'fen': '3k3n/rb1ppp1p/p7/p5bp/q1P1P3/3PnP2/1PP1RN1P/3B1QBK w - - 2 5', 'eval': 27 },
        { 'fen': 'kb2r2q/r1ppnpb1/p3p1p1/2P2p2/8/Q1PP1R1P/P1RP1PNN/2BKB3 w - - 0 3', 'eval': -24 },
        { 'fen': 'b2knnr1/p1p1p1p1/pb1p2q1/1r3p2/2R1PB2/PPBN3P/1PP3PQ/1KRN4 w - - 0 3', 'eval': 27 },
        { 'fen': 'kbq1r1nn/p1pp2p1/2p3rp/1b2p3/5QN1/2P2P2/PP1P1RPP/RK1BB2N w - - 0 2', 'eval': 13 },
        { 'fen': '2k1q2n/r1p1pppn/1p2p1br/4p3/2B5/P3P2P/PPP1RRP1/B2KN1Q1 w - - 0 2', 'eval': -23 },
        { 'fen': '2q2rk1/1rnpppp1/p2np1p1/3b1b2/3Q4/P2PRBP1/PP1NPP2/1K1NR2B w - - 4 3', 'eval': 9 },
        { 'fen': 'bnk2r2/p2bpn1p/1pr1qpp1/p7/P3P3/1PB1Q1P1/P1P2PNN/R1RB3K w - - 3 3', 'eval': 31 },
        { 'fen': 'qn1k2n1/4pp1p/1p1pp1rp/3b2r1/5N1Q/3b1PPP/PPPBP3/1B3KRN w - - 0 3', 'eval': 10 },
        { 'fen': 'kb4nr/rp4pp/p2qbpn1/5p2/8/PPPP1BP1/3RRP1P/2QN1B1K w - - 0 3', 'eval': 19 },
        { 'fen': '1n3k1r/p1pq1pbp/3rpppb/1P1n4/8/NRP1RP2/PP1P2PN/1KQB2B1 w - - 1 3', 'eval': -6 },
        { 'fen': '1k1b3r/1npprp2/pp4pp/q2b4/2B2R2/1P2NP2/1P1PNPPP/2KB2Q1 w - - 0 2', 'eval': 31 },
        { 'fen': '4n2k/ppp3pb/1brp3p/2n3p1/6P1/2Q3PP/PNPP1BP1/N1K1q1B1 w - - 0 3', 'eval': 7 },
        { 'fen': 'rbRn1k1r/pp4pq/5p2/b3pPp1/P4n2/1P1P1R2/PB1N1P1P/3QNKB1 w - - 0 4', 'eval': -5 },
        { 'fen': 'b2qk2n/3ppp2/1p1ppn1B/1p6/1P2P3/2RP3P/PP2PR2/1N2N1K1 w - - 0 4', 'eval': -12 },
        { 'fen': '1b1k1q2/pppbpnr1/2p2p2/2n2P1r/8/1P2RNPP/PR1P1P2/BQ1KB2N w - - 1 2', 'eval': -31 },
        { 'fen': '1brqk3/pnbp2p1/1ppnp3/2p2r2/5P2/PP2R1P1/1RNPPB1P/2NK2QB w - - 1 3', 'eval': -25 },
        { 'fen': '2bk1q1r/nppp2r1/p2npb1p/8/1p6/2PP1P1R/BPP2BPR/1Q3KNN w - - 0 3', 'eval': 8 },
        { 'fen': '1qb1rnk1/2n1p2r/ppp2b2/1p2P1pp/5B2/PP4P1/PN4PP/KN2BRRQ w - - 0 3', 'eval': 14 },
        { 'fen': '1n2k1br/2p1p1pp/1pqpp1r1/b1n5/4PB2/1P1NPP2/P2PPQN1/2BRK1R1 w - - 4 3', 'eval': 32 },
        { 'fen': '1rr1k3/R2n3p/1p1p2q1/3bp2b/1p5B/1P1P1P1P/PNPN2P1/1QK4B w - - 1 4', 'eval': -31 },
        { 'fen': '2k1nq2/pp1rp1np/pp4pb/2r5/5P2/3PP3/PPN1P1RP/KRQB3B w - - 2 5', 'eval': -13 },
        { 'fen': 'b2nkb2/2rq1pp1/1rn1pp1p/p1p5/2P5/B2PRNP1/PPP2RNP/K1Q2B2 w - - 2 5', 'eval': 1 },
        { 'fen': 'k5q1/bp2pp2/2pr1bpp/1n2p3/1P4NB/3NnPP1/PPPR3P/K1BQ4 w - - 0 3', 'eval': 28 },
        { 'fen': '2q1n2k/p2pnppb/2pprr2/1b3p2/Q7/P1P2B2/PR1PPP1P/NR1NKB2 w - - 2 2', 'eval': 19 },
        { 'fen': '2qn1bkn/pp3bp1/rpp4p/p7/P2N4/2BPr3/PPP3PQ/1NRB2KR w - - 2 4', 'eval': -13 },
        { 'fen': 'q1n4k/p1r1p2p/2p3pb/bp3rp1/2P5/1Bn1RPP1/1P2PBPP/2Q2NRK w - - 0 3', 'eval': 24 },
        { 'fen': 'k2n3r/p1p1npbp/p1R1p1p1/7r/P5BR/4NP1P/P2PP1PN/1q3KQB w - - 1 2', 'eval': 34 },
        { 'fen': '1q4k1/b1pbppp1/1p2ppn1/8/2n1P3/2rNPQP1/PRP2P1K/2RB1B2 w - - 2 4', 'eval': -25 },
        { 'fen': 'qbr2n1k/2p1pp1n/bp1pp1p1/1B3r2/P4R1R/N5PP/1PP1PP2/1N1QB2K w - - 0 2', 'eval': -30 },
        { 'fen': 'r1kq3n/1p3pp1/1b2p3/1B1n1pp1/8/2P1NPbP/PP1P1N2/K3RQ1R w - - 1 5', 'eval': -22 },
    ];
    const get_random_position = (seedstr, oneset) => {
        let positions = positions_multiset.concat(positions_oneset);
        let seed = -1;
        if (seedstr != null) {
            seed = parseInt(seedstr);
        }
        if (seed == null || isNaN(seed) || seed <= 0 || seed > positions.length) {
            if (oneset == 'false') {
                seed = Math.floor(Math.random() * positions_multiset.length) + 1;
            }
            else if (oneset == 'true') {
                seed = Math.floor(Math.random() * positions_oneset.length) + positions_multiset.length + 1;
            }
            else {
                seed = Math.floor(Math.random() * (positions_oneset.length + positions_multiset.length)) + 1;
            }
        }
        const position = positions[seed - 1];
        let result = {
            'fen': position['fen'],
            'eval': position['eval'],
            'seed': seed,
        };
        return result;
    };

    const renderHome = ctrl => (ctrl.auth.me ? userHome(ctrl) : anonHome(ctrl));
    const searchParams = new URLSearchParams(window.location.search);
    let position = get_random_position(searchParams.get('seed'), searchParams.get('oneset'));
    let difficulty = 1;
    const playAI = (difficulty, ctrl) => h('button.btn.btn-outline-primary.btn-lg', {
        attrs: { type: 'button' },
        on: { click: () => ctrl.playAi(difficulty, position['fen']) },
    }, 'Play the Lichess AI (level ' + difficulty + ') from this position');
    const userHome = (ctrl) => {
        const playAINode = playAI(difficulty, ctrl);
        return [
            h('div', [
                renderRandomApp(ctrl),
                h('div.btn-group.mt-5', [
                    playAINode,
                    h('button.btn.btn-outline-primary.btn-lg', {
                        attrs: { type: 'button' },
                        on: { click: () => { difficulty = (difficulty % 8) + 1; ctrl.redraw(); } },
                    }, 'Harder AI'),
                    h('button.btn.btn-outline-primary.btn-lg', {
                        attrs: { type: 'button' },
                        on: { click: () => ctrl.playMaia(position['fen'], 'maia1') },
                    }, 'Play maia1 (rating ~1.4k)'),
                    h('button.btn.btn-outline-primary.btn-lg', {
                        attrs: { type: 'button' },
                        on: { click: () => ctrl.playMaia(position['fen'], 'maia9') },
                    }, 'Play maia9 (rating ~1.7k)'),
                    // h(
                    //   'button.btn.btn-outline-primary.btn-lg',
                    //   {
                    //     attrs: { type: 'button' },
                    //     on: { click: () => ctrl.playPool(10, 3) },
                    //   },
                    //   'Play an unrated 10+3 game with a random opponent'
                    // ),
                ]),
                h('h2.mt-5', 'Games in progress'),
                h('div.games', renderGames(ctrl.games)),
            ]),
        ];
    };
    const renderGames = (ongoing) => ongoing.games.length ? ongoing.games.map(renderGameWidget) : [h('p', 'No ongoing games at the moment')];
    const renderGameWidget = (game) => h(`a.game-widget.text-decoration-none.game-widget--${game.id}`, {
        attrs: href(`/game/${game.gameId}`),
    }, [
        h('span.game-widget__opponent', [
            h('span.game-widget__opponent__name', game.opponent.username || 'Anon'),
            game.opponent.rating && h('span.game-widget__opponent__rating', game.opponent.rating),
        ]),
        h('span.game-widget__board.cg-wrap', {
            hook: {
                insert(vnode) {
                    const el = vnode.elm;
                    Chessground(el, {
                        fen: game.fen,
                        orientation: game.color,
                        lastMove: game.lastMoveenderAbout().match(/.{1,2}/g),
                        viewOnly: true,
                        movable: { free: false },
                        drawable: { visible: false },
                        coordinates: false,
                    });
                },
            },
        }, 'board'),
    ]);
    const anonHome = (ctrl) => [
        h('div.login.text-center', [
            renderRandomApp(ctrl),
            h('div.big', [h('p', 'Please log in to play this position.')]),
            h('a.btn.btn-primary.btn-lg.mt-5', {
                attrs: href('/login'),
            }, 'Login with Lichess'),
        ]),
    ];
    const renderPosition = (fen) => {
        return h('div', [
            h('span.game-widget__board.cg-wrap.mt-5', {
                hook: {
                    insert(vnode) {
                        const el = vnode.elm;
                        Chessground(el, {
                            fen: fen,
                            orientation: 'white',
                            viewOnly: true,
                            coordinates: true,
                        });
                    },
                    postpatch(vnode, nvnode) {
                        console.log('patch');
                        const el = nvnode.elm;
                        Chessground(el, {
                            fen: fen,
                            orientation: 'white',
                            viewOnly: true,
                            coordinates: true,
                        });
                    }
                },
            }, 'board'),
            h('p', 'White to move '),
            h('p', 'Position #' + position['seed']),
            h('samp', 'FEN: ' + fen),
            h('div', [
                h('span', 'Analysis Board: '),
                h('a', { attrs: { href: 'https://lichess.org/analysis/standard/' + position['fen'] } }, 'https://lichess.org/analysis/standard/' + fen),
            ])
        ]);
    };
    const renderRandomApp = (ctrl) => {
        const positionNode = renderPosition(position['fen']);
        const positionLink = window.location.protocol + "//" + window.location.host + window.location.pathname + "?seed=" + position['seed'];
        return h('div', [
            positionNode,
            h('div', [
                h('span', 'Link to this position: '),
                h('a', { attrs: { href: positionLink } }, positionLink),
            ]),
            h('div.btn-group.mt-5', [
                h('button.btn.btn-outline-primary.btn-lg', {
                    attrs: { type: 'button' },
                    on: { click: () => { position = get_random_position("", ""); ctrl.redraw(); } }
                }, 'New random position'),
                h('button.btn.btn-outline-primary.btn-lg', {
                    attrs: { type: 'button' },
                    on: { click: () => { position = get_random_position("", "true"); ctrl.redraw(); } }
                }, 'New random position for one board'),
            ])
        ]);
    };

    const renderSeek = ctrl => _ => [
        h('div.seek-page', {
            hook: {
                destroy: ctrl.onUnmount,
            },
        }, [
            h('div.seek-page__awaiting', [spinner(), h('span.ms-3', 'Awaiting a game...')]),
            h('a.btn.btn-secondary', {
                attrs: { href: url('/') },
            }, 'Cancel'),
        ]),
    ];

    const renderTv = ctrl => _ => [
        h(`div.game-page.game-page--${ctrl.game.id}`, {
            hook: {
                destroy: ctrl.onUnmount,
            },
        }, [
            renderTvPlayer(ctrl, opposite(ctrl.game.orientation)),
            renderBoard(ctrl),
            renderTvPlayer(ctrl, ctrl.game.orientation),
        ]),
    ];
    const renderTvPlayer = (ctrl, color) => {
        const p = ctrl.player(color);
        const clock = clockContent(p.seconds && p.seconds * 1000, color == ctrl.chess.turn ? ctrl.lastUpdateAt - Date.now() : 0);
        return renderPlayer(ctrl, color, clock, p.user.name, p.user.title, p.rating);
    };

    function view(ctrl) {
        return layout(ctrl, selectRenderer(ctrl)(ctrl));
    }
    const selectRenderer = (ctrl) => {
        if (ctrl.page == 'game')
            return ctrl.game ? renderGame(ctrl.game) : renderLoading;
        if (ctrl.page == 'home')
            return renderHome;
        if (ctrl.page == 'seek' && ctrl.seek)
            return renderSeek(ctrl.seek);
        if (ctrl.page == 'challenge' && ctrl.challenge)
            return renderChallenge(ctrl.challenge);
        if (ctrl.page == 'tv')
            return ctrl.tv ? renderTv(ctrl.tv) : renderLoading;
        return renderNotFound;
    };
    const renderLoading = _ => [loadingBody()];
    const renderNotFound = _ => [h('h1', 'Not found')];
    const loadingBody = () => h('div.loading', spinner());
    const spinner = () => h('div.spinner-border.text-primary', { attrs: { role: 'status' } }, h('span.visually-hidden', 'Loading...'));

    var dropdown = {exports: {}};

    var top = 'top';
    var bottom = 'bottom';
    var right = 'right';
    var left = 'left';
    var auto = 'auto';
    var basePlacements = [top, bottom, right, left];
    var start = 'start';
    var end = 'end';
    var clippingParents = 'clippingParents';
    var viewport = 'viewport';
    var popper = 'popper';
    var reference = 'reference';
    var variationPlacements = /*#__PURE__*/basePlacements.reduce(function (acc, placement) {
      return acc.concat([placement + "-" + start, placement + "-" + end]);
    }, []);
    var placements = /*#__PURE__*/[].concat(basePlacements, [auto]).reduce(function (acc, placement) {
      return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
    }, []); // modifiers that need to read the DOM

    var beforeRead = 'beforeRead';
    var read = 'read';
    var afterRead = 'afterRead'; // pure-logic modifiers

    var beforeMain = 'beforeMain';
    var main$1 = 'main';
    var afterMain = 'afterMain'; // modifier with the purpose to write to the DOM (or write into a framework state)

    var beforeWrite = 'beforeWrite';
    var write = 'write';
    var afterWrite = 'afterWrite';
    var modifierPhases = [beforeRead, read, afterRead, beforeMain, main$1, afterMain, beforeWrite, write, afterWrite];

    function getNodeName(element) {
      return element ? (element.nodeName || '').toLowerCase() : null;
    }

    function getWindow(node) {
      if (node == null) {
        return window;
      }

      if (node.toString() !== '[object Window]') {
        var ownerDocument = node.ownerDocument;
        return ownerDocument ? ownerDocument.defaultView || window : window;
      }

      return node;
    }

    function isElement(node) {
      var OwnElement = getWindow(node).Element;
      return node instanceof OwnElement || node instanceof Element;
    }

    function isHTMLElement(node) {
      var OwnElement = getWindow(node).HTMLElement;
      return node instanceof OwnElement || node instanceof HTMLElement;
    }

    function isShadowRoot(node) {
      // IE 11 has no ShadowRoot
      if (typeof ShadowRoot === 'undefined') {
        return false;
      }

      var OwnElement = getWindow(node).ShadowRoot;
      return node instanceof OwnElement || node instanceof ShadowRoot;
    }

    // and applies them to the HTMLElements such as popper and arrow

    function applyStyles(_ref) {
      var state = _ref.state;
      Object.keys(state.elements).forEach(function (name) {
        var style = state.styles[name] || {};
        var attributes = state.attributes[name] || {};
        var element = state.elements[name]; // arrow is optional + virtual elements

        if (!isHTMLElement(element) || !getNodeName(element)) {
          return;
        } // Flow doesn't support to extend this property, but it's the most
        // effective way to apply styles to an HTMLElement
        // $FlowFixMe[cannot-write]


        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function (name) {
          var value = attributes[name];

          if (value === false) {
            element.removeAttribute(name);
          } else {
            element.setAttribute(name, value === true ? '' : value);
          }
        });
      });
    }

    function effect$2(_ref2) {
      var state = _ref2.state;
      var initialStyles = {
        popper: {
          position: state.options.strategy,
          left: '0',
          top: '0',
          margin: '0'
        },
        arrow: {
          position: 'absolute'
        },
        reference: {}
      };
      Object.assign(state.elements.popper.style, initialStyles.popper);
      state.styles = initialStyles;

      if (state.elements.arrow) {
        Object.assign(state.elements.arrow.style, initialStyles.arrow);
      }

      return function () {
        Object.keys(state.elements).forEach(function (name) {
          var element = state.elements[name];
          var attributes = state.attributes[name] || {};
          var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]); // Set all values to an empty string to unset them

          var style = styleProperties.reduce(function (style, property) {
            style[property] = '';
            return style;
          }, {}); // arrow is optional + virtual elements

          if (!isHTMLElement(element) || !getNodeName(element)) {
            return;
          }

          Object.assign(element.style, style);
          Object.keys(attributes).forEach(function (attribute) {
            element.removeAttribute(attribute);
          });
        });
      };
    } // eslint-disable-next-line import/no-unused-modules


    var applyStyles$1 = {
      name: 'applyStyles',
      enabled: true,
      phase: 'write',
      fn: applyStyles,
      effect: effect$2,
      requires: ['computeStyles']
    };

    function getBasePlacement(placement) {
      return placement.split('-')[0];
    }

    var max = Math.max;
    var min = Math.min;
    var round = Math.round;

    function getBoundingClientRect(element, includeScale) {
      if (includeScale === void 0) {
        includeScale = false;
      }

      var rect = element.getBoundingClientRect();
      var scaleX = 1;
      var scaleY = 1;

      if (isHTMLElement(element) && includeScale) {
        var offsetHeight = element.offsetHeight;
        var offsetWidth = element.offsetWidth; // Do not attempt to divide by 0, otherwise we get `Infinity` as scale
        // Fallback to 1 in case both values are `0`

        if (offsetWidth > 0) {
          scaleX = round(rect.width) / offsetWidth || 1;
        }

        if (offsetHeight > 0) {
          scaleY = round(rect.height) / offsetHeight || 1;
        }
      }

      return {
        width: rect.width / scaleX,
        height: rect.height / scaleY,
        top: rect.top / scaleY,
        right: rect.right / scaleX,
        bottom: rect.bottom / scaleY,
        left: rect.left / scaleX,
        x: rect.left / scaleX,
        y: rect.top / scaleY
      };
    }

    // means it doesn't take into account transforms.

    function getLayoutRect(element) {
      var clientRect = getBoundingClientRect(element); // Use the clientRect sizes if it's not been transformed.
      // Fixes https://github.com/popperjs/popper-core/issues/1223

      var width = element.offsetWidth;
      var height = element.offsetHeight;

      if (Math.abs(clientRect.width - width) <= 1) {
        width = clientRect.width;
      }

      if (Math.abs(clientRect.height - height) <= 1) {
        height = clientRect.height;
      }

      return {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: width,
        height: height
      };
    }

    function contains(parent, child) {
      var rootNode = child.getRootNode && child.getRootNode(); // First, attempt with faster native method

      if (parent.contains(child)) {
        return true;
      } // then fallback to custom implementation with Shadow DOM support
      else if (rootNode && isShadowRoot(rootNode)) {
          var next = child;

          do {
            if (next && parent.isSameNode(next)) {
              return true;
            } // $FlowFixMe[prop-missing]: need a better way to handle this...


            next = next.parentNode || next.host;
          } while (next);
        } // Give up, the result is false


      return false;
    }

    function getComputedStyle$1(element) {
      return getWindow(element).getComputedStyle(element);
    }

    function isTableElement(element) {
      return ['table', 'td', 'th'].indexOf(getNodeName(element)) >= 0;
    }

    function getDocumentElement(element) {
      // $FlowFixMe[incompatible-return]: assume body is always available
      return ((isElement(element) ? element.ownerDocument : // $FlowFixMe[prop-missing]
      element.document) || window.document).documentElement;
    }

    function getParentNode(element) {
      if (getNodeName(element) === 'html') {
        return element;
      }

      return (// this is a quicker (but less type safe) way to save quite some bytes from the bundle
        // $FlowFixMe[incompatible-return]
        // $FlowFixMe[prop-missing]
        element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
        element.parentNode || ( // DOM Element detected
        isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
        // $FlowFixMe[incompatible-call]: HTMLElement is a Node
        getDocumentElement(element) // fallback

      );
    }

    function getTrueOffsetParent(element) {
      if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
      getComputedStyle$1(element).position === 'fixed') {
        return null;
      }

      return element.offsetParent;
    } // `.offsetParent` reports `null` for fixed elements, while absolute elements
    // return the containing block


    function getContainingBlock(element) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
      var isIE = navigator.userAgent.indexOf('Trident') !== -1;

      if (isIE && isHTMLElement(element)) {
        // In IE 9, 10 and 11 fixed elements containing block is always established by the viewport
        var elementCss = getComputedStyle$1(element);

        if (elementCss.position === 'fixed') {
          return null;
        }
      }

      var currentNode = getParentNode(element);

      if (isShadowRoot(currentNode)) {
        currentNode = currentNode.host;
      }

      while (isHTMLElement(currentNode) && ['html', 'body'].indexOf(getNodeName(currentNode)) < 0) {
        var css = getComputedStyle$1(currentNode); // This is non-exhaustive but covers the most common CSS properties that
        // create a containing block.
        // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block

        if (css.transform !== 'none' || css.perspective !== 'none' || css.contain === 'paint' || ['transform', 'perspective'].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === 'filter' || isFirefox && css.filter && css.filter !== 'none') {
          return currentNode;
        } else {
          currentNode = currentNode.parentNode;
        }
      }

      return null;
    } // Gets the closest ancestor positioned element. Handles some edge cases,
    // such as table ancestors and cross browser bugs.


    function getOffsetParent(element) {
      var window = getWindow(element);
      var offsetParent = getTrueOffsetParent(element);

      while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === 'static') {
        offsetParent = getTrueOffsetParent(offsetParent);
      }

      if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle$1(offsetParent).position === 'static')) {
        return window;
      }

      return offsetParent || getContainingBlock(element) || window;
    }

    function getMainAxisFromPlacement(placement) {
      return ['top', 'bottom'].indexOf(placement) >= 0 ? 'x' : 'y';
    }

    function within(min$1, value, max$1) {
      return max(min$1, min(value, max$1));
    }
    function withinMaxClamp(min, value, max) {
      var v = within(min, value, max);
      return v > max ? max : v;
    }

    function getFreshSideObject() {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }

    function mergePaddingObject(paddingObject) {
      return Object.assign({}, getFreshSideObject(), paddingObject);
    }

    function expandToHashMap(value, keys) {
      return keys.reduce(function (hashMap, key) {
        hashMap[key] = value;
        return hashMap;
      }, {});
    }

    var toPaddingObject = function toPaddingObject(padding, state) {
      padding = typeof padding === 'function' ? padding(Object.assign({}, state.rects, {
        placement: state.placement
      })) : padding;
      return mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
    };

    function arrow(_ref) {
      var _state$modifiersData$;

      var state = _ref.state,
          name = _ref.name,
          options = _ref.options;
      var arrowElement = state.elements.arrow;
      var popperOffsets = state.modifiersData.popperOffsets;
      var basePlacement = getBasePlacement(state.placement);
      var axis = getMainAxisFromPlacement(basePlacement);
      var isVertical = [left, right].indexOf(basePlacement) >= 0;
      var len = isVertical ? 'height' : 'width';

      if (!arrowElement || !popperOffsets) {
        return;
      }

      var paddingObject = toPaddingObject(options.padding, state);
      var arrowRect = getLayoutRect(arrowElement);
      var minProp = axis === 'y' ? top : left;
      var maxProp = axis === 'y' ? bottom : right;
      var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets[axis] - state.rects.popper[len];
      var startDiff = popperOffsets[axis] - state.rects.reference[axis];
      var arrowOffsetParent = getOffsetParent(arrowElement);
      var clientSize = arrowOffsetParent ? axis === 'y' ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
      var centerToReference = endDiff / 2 - startDiff / 2; // Make sure the arrow doesn't overflow the popper if the center point is
      // outside of the popper bounds

      var min = paddingObject[minProp];
      var max = clientSize - arrowRect[len] - paddingObject[maxProp];
      var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
      var offset = within(min, center, max); // Prevents breaking syntax highlighting...

      var axisProp = axis;
      state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset, _state$modifiersData$.centerOffset = offset - center, _state$modifiersData$);
    }

    function effect$1(_ref2) {
      var state = _ref2.state,
          options = _ref2.options;
      var _options$element = options.element,
          arrowElement = _options$element === void 0 ? '[data-popper-arrow]' : _options$element;

      if (arrowElement == null) {
        return;
      } // CSS selector


      if (typeof arrowElement === 'string') {
        arrowElement = state.elements.popper.querySelector(arrowElement);

        if (!arrowElement) {
          return;
        }
      }

      if (process.env.NODE_ENV !== "production") {
        if (!isHTMLElement(arrowElement)) {
          console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', 'To use an SVG arrow, wrap it in an HTMLElement that will be used as', 'the arrow.'].join(' '));
        }
      }

      if (!contains(state.elements.popper, arrowElement)) {
        if (process.env.NODE_ENV !== "production") {
          console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', 'element.'].join(' '));
        }

        return;
      }

      state.elements.arrow = arrowElement;
    } // eslint-disable-next-line import/no-unused-modules


    var arrow$1 = {
      name: 'arrow',
      enabled: true,
      phase: 'main',
      fn: arrow,
      effect: effect$1,
      requires: ['popperOffsets'],
      requiresIfExists: ['preventOverflow']
    };

    function getVariation(placement) {
      return placement.split('-')[1];
    }

    var unsetSides = {
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto'
    }; // Round the offsets to the nearest suitable subpixel based on the DPR.
    // Zooming can change the DPR, but it seems to report a value that will
    // cleanly divide the values into the appropriate subpixels.

    function roundOffsetsByDPR(_ref) {
      var x = _ref.x,
          y = _ref.y;
      var win = window;
      var dpr = win.devicePixelRatio || 1;
      return {
        x: round(x * dpr) / dpr || 0,
        y: round(y * dpr) / dpr || 0
      };
    }

    function mapToStyles(_ref2) {
      var _Object$assign2;

      var popper = _ref2.popper,
          popperRect = _ref2.popperRect,
          placement = _ref2.placement,
          variation = _ref2.variation,
          offsets = _ref2.offsets,
          position = _ref2.position,
          gpuAcceleration = _ref2.gpuAcceleration,
          adaptive = _ref2.adaptive,
          roundOffsets = _ref2.roundOffsets,
          isFixed = _ref2.isFixed;
      var _offsets$x = offsets.x,
          x = _offsets$x === void 0 ? 0 : _offsets$x,
          _offsets$y = offsets.y,
          y = _offsets$y === void 0 ? 0 : _offsets$y;

      var _ref3 = typeof roundOffsets === 'function' ? roundOffsets({
        x: x,
        y: y
      }) : {
        x: x,
        y: y
      };

      x = _ref3.x;
      y = _ref3.y;
      var hasX = offsets.hasOwnProperty('x');
      var hasY = offsets.hasOwnProperty('y');
      var sideX = left;
      var sideY = top;
      var win = window;

      if (adaptive) {
        var offsetParent = getOffsetParent(popper);
        var heightProp = 'clientHeight';
        var widthProp = 'clientWidth';

        if (offsetParent === getWindow(popper)) {
          offsetParent = getDocumentElement(popper);

          if (getComputedStyle$1(offsetParent).position !== 'static' && position === 'absolute') {
            heightProp = 'scrollHeight';
            widthProp = 'scrollWidth';
          }
        } // $FlowFixMe[incompatible-cast]: force type refinement, we compare offsetParent with window above, but Flow doesn't detect it


        offsetParent = offsetParent;

        if (placement === top || (placement === left || placement === right) && variation === end) {
          sideY = bottom;
          var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : // $FlowFixMe[prop-missing]
          offsetParent[heightProp];
          y -= offsetY - popperRect.height;
          y *= gpuAcceleration ? 1 : -1;
        }

        if (placement === left || (placement === top || placement === bottom) && variation === end) {
          sideX = right;
          var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : // $FlowFixMe[prop-missing]
          offsetParent[widthProp];
          x -= offsetX - popperRect.width;
          x *= gpuAcceleration ? 1 : -1;
        }
      }

      var commonStyles = Object.assign({
        position: position
      }, adaptive && unsetSides);

      var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
        x: x,
        y: y
      }) : {
        x: x,
        y: y
      };

      x = _ref4.x;
      y = _ref4.y;

      if (gpuAcceleration) {
        var _Object$assign;

        return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? '0' : '', _Object$assign[sideX] = hasX ? '0' : '', _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
      }

      return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : '', _Object$assign2[sideX] = hasX ? x + "px" : '', _Object$assign2.transform = '', _Object$assign2));
    }

    function computeStyles(_ref5) {
      var state = _ref5.state,
          options = _ref5.options;
      var _options$gpuAccelerat = options.gpuAcceleration,
          gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat,
          _options$adaptive = options.adaptive,
          adaptive = _options$adaptive === void 0 ? true : _options$adaptive,
          _options$roundOffsets = options.roundOffsets,
          roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;

      if (process.env.NODE_ENV !== "production") {
        var transitionProperty = getComputedStyle$1(state.elements.popper).transitionProperty || '';

        if (adaptive && ['transform', 'top', 'right', 'bottom', 'left'].some(function (property) {
          return transitionProperty.indexOf(property) >= 0;
        })) {
          console.warn(['Popper: Detected CSS transitions on at least one of the following', 'CSS properties: "transform", "top", "right", "bottom", "left".', '\n\n', 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', 'for smooth transitions, or remove these properties from the CSS', 'transition declaration on the popper element if only transitioning', 'opacity or background-color for example.', '\n\n', 'We recommend using the popper element as a wrapper around an inner', 'element that can have any CSS property transitioned for animations.'].join(' '));
        }
      }

      var commonStyles = {
        placement: getBasePlacement(state.placement),
        variation: getVariation(state.placement),
        popper: state.elements.popper,
        popperRect: state.rects.popper,
        gpuAcceleration: gpuAcceleration,
        isFixed: state.options.strategy === 'fixed'
      };

      if (state.modifiersData.popperOffsets != null) {
        state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.popperOffsets,
          position: state.options.strategy,
          adaptive: adaptive,
          roundOffsets: roundOffsets
        })));
      }

      if (state.modifiersData.arrow != null) {
        state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.arrow,
          position: 'absolute',
          adaptive: false,
          roundOffsets: roundOffsets
        })));
      }

      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        'data-popper-placement': state.placement
      });
    } // eslint-disable-next-line import/no-unused-modules


    var computeStyles$1 = {
      name: 'computeStyles',
      enabled: true,
      phase: 'beforeWrite',
      fn: computeStyles,
      data: {}
    };

    var passive = {
      passive: true
    };

    function effect(_ref) {
      var state = _ref.state,
          instance = _ref.instance,
          options = _ref.options;
      var _options$scroll = options.scroll,
          scroll = _options$scroll === void 0 ? true : _options$scroll,
          _options$resize = options.resize,
          resize = _options$resize === void 0 ? true : _options$resize;
      var window = getWindow(state.elements.popper);
      var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);

      if (scroll) {
        scrollParents.forEach(function (scrollParent) {
          scrollParent.addEventListener('scroll', instance.update, passive);
        });
      }

      if (resize) {
        window.addEventListener('resize', instance.update, passive);
      }

      return function () {
        if (scroll) {
          scrollParents.forEach(function (scrollParent) {
            scrollParent.removeEventListener('scroll', instance.update, passive);
          });
        }

        if (resize) {
          window.removeEventListener('resize', instance.update, passive);
        }
      };
    } // eslint-disable-next-line import/no-unused-modules


    var eventListeners = {
      name: 'eventListeners',
      enabled: true,
      phase: 'write',
      fn: function fn() {},
      effect: effect,
      data: {}
    };

    var hash$1 = {
      left: 'right',
      right: 'left',
      bottom: 'top',
      top: 'bottom'
    };
    function getOppositePlacement(placement) {
      return placement.replace(/left|right|bottom|top/g, function (matched) {
        return hash$1[matched];
      });
    }

    var hash = {
      start: 'end',
      end: 'start'
    };
    function getOppositeVariationPlacement(placement) {
      return placement.replace(/start|end/g, function (matched) {
        return hash[matched];
      });
    }

    function getWindowScroll(node) {
      var win = getWindow(node);
      var scrollLeft = win.pageXOffset;
      var scrollTop = win.pageYOffset;
      return {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop
      };
    }

    function getWindowScrollBarX(element) {
      // If <html> has a CSS width greater than the viewport, then this will be
      // incorrect for RTL.
      // Popper 1 is broken in this case and never had a bug report so let's assume
      // it's not an issue. I don't think anyone ever specifies width on <html>
      // anyway.
      // Browsers where the left scrollbar doesn't cause an issue report `0` for
      // this (e.g. Edge 2019, IE11, Safari)
      return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
    }

    function getViewportRect(element) {
      var win = getWindow(element);
      var html = getDocumentElement(element);
      var visualViewport = win.visualViewport;
      var width = html.clientWidth;
      var height = html.clientHeight;
      var x = 0;
      var y = 0; // NB: This isn't supported on iOS <= 12. If the keyboard is open, the popper
      // can be obscured underneath it.
      // Also, `html.clientHeight` adds the bottom bar height in Safari iOS, even
      // if it isn't open, so if this isn't available, the popper will be detected
      // to overflow the bottom of the screen too early.

      if (visualViewport) {
        width = visualViewport.width;
        height = visualViewport.height; // Uses Layout Viewport (like Chrome; Safari does not currently)
        // In Chrome, it returns a value very close to 0 (+/-) but contains rounding
        // errors due to floating point numbers, so we need to check precision.
        // Safari returns a number <= 0, usually < -1 when pinch-zoomed
        // Feature detection fails in mobile emulation mode in Chrome.
        // Math.abs(win.innerWidth / visualViewport.scale - visualViewport.width) <
        // 0.001
        // Fallback here: "Not Safari" userAgent

        if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          x = visualViewport.offsetLeft;
          y = visualViewport.offsetTop;
        }
      }

      return {
        width: width,
        height: height,
        x: x + getWindowScrollBarX(element),
        y: y
      };
    }

    // of the `<html>` and `<body>` rect bounds if horizontally scrollable

    function getDocumentRect(element) {
      var _element$ownerDocumen;

      var html = getDocumentElement(element);
      var winScroll = getWindowScroll(element);
      var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
      var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
      var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
      var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
      var y = -winScroll.scrollTop;

      if (getComputedStyle$1(body || html).direction === 'rtl') {
        x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
      }

      return {
        width: width,
        height: height,
        x: x,
        y: y
      };
    }

    function isScrollParent(element) {
      // Firefox wants us to check `-x` and `-y` variations as well
      var _getComputedStyle = getComputedStyle$1(element),
          overflow = _getComputedStyle.overflow,
          overflowX = _getComputedStyle.overflowX,
          overflowY = _getComputedStyle.overflowY;

      return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }

    function getScrollParent(node) {
      if (['html', 'body', '#document'].indexOf(getNodeName(node)) >= 0) {
        // $FlowFixMe[incompatible-return]: assume body is always available
        return node.ownerDocument.body;
      }

      if (isHTMLElement(node) && isScrollParent(node)) {
        return node;
      }

      return getScrollParent(getParentNode(node));
    }

    /*
    given a DOM element, return the list of all scroll parents, up the list of ancesors
    until we get to the top window object. This list is what we attach scroll listeners
    to, because if any of these parent elements scroll, we'll need to re-calculate the
    reference element's position.
    */

    function listScrollParents(element, list) {
      var _element$ownerDocumen;

      if (list === void 0) {
        list = [];
      }

      var scrollParent = getScrollParent(element);
      var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
      var win = getWindow(scrollParent);
      var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
      var updatedList = list.concat(target);
      return isBody ? updatedList : // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
      updatedList.concat(listScrollParents(getParentNode(target)));
    }

    function rectToClientRect(rect) {
      return Object.assign({}, rect, {
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height
      });
    }

    function getInnerBoundingClientRect(element) {
      var rect = getBoundingClientRect(element);
      rect.top = rect.top + element.clientTop;
      rect.left = rect.left + element.clientLeft;
      rect.bottom = rect.top + element.clientHeight;
      rect.right = rect.left + element.clientWidth;
      rect.width = element.clientWidth;
      rect.height = element.clientHeight;
      rect.x = rect.left;
      rect.y = rect.top;
      return rect;
    }

    function getClientRectFromMixedType(element, clippingParent) {
      return clippingParent === viewport ? rectToClientRect(getViewportRect(element)) : isElement(clippingParent) ? getInnerBoundingClientRect(clippingParent) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
    } // A "clipping parent" is an overflowable container with the characteristic of
    // clipping (or hiding) overflowing elements with a position different from
    // `initial`


    function getClippingParents(element) {
      var clippingParents = listScrollParents(getParentNode(element));
      var canEscapeClipping = ['absolute', 'fixed'].indexOf(getComputedStyle$1(element).position) >= 0;
      var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;

      if (!isElement(clipperElement)) {
        return [];
      } // $FlowFixMe[incompatible-return]: https://github.com/facebook/flow/issues/1414


      return clippingParents.filter(function (clippingParent) {
        return isElement(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== 'body';
      });
    } // Gets the maximum area that the element is visible in due to any number of
    // clipping parents


    function getClippingRect(element, boundary, rootBoundary) {
      var mainClippingParents = boundary === 'clippingParents' ? getClippingParents(element) : [].concat(boundary);
      var clippingParents = [].concat(mainClippingParents, [rootBoundary]);
      var firstClippingParent = clippingParents[0];
      var clippingRect = clippingParents.reduce(function (accRect, clippingParent) {
        var rect = getClientRectFromMixedType(element, clippingParent);
        accRect.top = max(rect.top, accRect.top);
        accRect.right = min(rect.right, accRect.right);
        accRect.bottom = min(rect.bottom, accRect.bottom);
        accRect.left = max(rect.left, accRect.left);
        return accRect;
      }, getClientRectFromMixedType(element, firstClippingParent));
      clippingRect.width = clippingRect.right - clippingRect.left;
      clippingRect.height = clippingRect.bottom - clippingRect.top;
      clippingRect.x = clippingRect.left;
      clippingRect.y = clippingRect.top;
      return clippingRect;
    }

    function computeOffsets(_ref) {
      var reference = _ref.reference,
          element = _ref.element,
          placement = _ref.placement;
      var basePlacement = placement ? getBasePlacement(placement) : null;
      var variation = placement ? getVariation(placement) : null;
      var commonX = reference.x + reference.width / 2 - element.width / 2;
      var commonY = reference.y + reference.height / 2 - element.height / 2;
      var offsets;

      switch (basePlacement) {
        case top:
          offsets = {
            x: commonX,
            y: reference.y - element.height
          };
          break;

        case bottom:
          offsets = {
            x: commonX,
            y: reference.y + reference.height
          };
          break;

        case right:
          offsets = {
            x: reference.x + reference.width,
            y: commonY
          };
          break;

        case left:
          offsets = {
            x: reference.x - element.width,
            y: commonY
          };
          break;

        default:
          offsets = {
            x: reference.x,
            y: reference.y
          };
      }

      var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;

      if (mainAxis != null) {
        var len = mainAxis === 'y' ? 'height' : 'width';

        switch (variation) {
          case start:
            offsets[mainAxis] = offsets[mainAxis] - (reference[len] / 2 - element[len] / 2);
            break;

          case end:
            offsets[mainAxis] = offsets[mainAxis] + (reference[len] / 2 - element[len] / 2);
            break;
        }
      }

      return offsets;
    }

    function detectOverflow(state, options) {
      if (options === void 0) {
        options = {};
      }

      var _options = options,
          _options$placement = _options.placement,
          placement = _options$placement === void 0 ? state.placement : _options$placement,
          _options$boundary = _options.boundary,
          boundary = _options$boundary === void 0 ? clippingParents : _options$boundary,
          _options$rootBoundary = _options.rootBoundary,
          rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary,
          _options$elementConte = _options.elementContext,
          elementContext = _options$elementConte === void 0 ? popper : _options$elementConte,
          _options$altBoundary = _options.altBoundary,
          altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary,
          _options$padding = _options.padding,
          padding = _options$padding === void 0 ? 0 : _options$padding;
      var paddingObject = mergePaddingObject(typeof padding !== 'number' ? padding : expandToHashMap(padding, basePlacements));
      var altContext = elementContext === popper ? reference : popper;
      var popperRect = state.rects.popper;
      var element = state.elements[altBoundary ? altContext : elementContext];
      var clippingClientRect = getClippingRect(isElement(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary);
      var referenceClientRect = getBoundingClientRect(state.elements.reference);
      var popperOffsets = computeOffsets({
        reference: referenceClientRect,
        element: popperRect,
        strategy: 'absolute',
        placement: placement
      });
      var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets));
      var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect; // positive = overflowing the clipping rect
      // 0 or negative = within the clipping rect

      var overflowOffsets = {
        top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
        bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
        left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
        right: elementClientRect.right - clippingClientRect.right + paddingObject.right
      };
      var offsetData = state.modifiersData.offset; // Offsets can be applied only to the popper element

      if (elementContext === popper && offsetData) {
        var offset = offsetData[placement];
        Object.keys(overflowOffsets).forEach(function (key) {
          var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
          var axis = [top, bottom].indexOf(key) >= 0 ? 'y' : 'x';
          overflowOffsets[key] += offset[axis] * multiply;
        });
      }

      return overflowOffsets;
    }

    function computeAutoPlacement(state, options) {
      if (options === void 0) {
        options = {};
      }

      var _options = options,
          placement = _options.placement,
          boundary = _options.boundary,
          rootBoundary = _options.rootBoundary,
          padding = _options.padding,
          flipVariations = _options.flipVariations,
          _options$allowedAutoP = _options.allowedAutoPlacements,
          allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
      var variation = getVariation(placement);
      var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function (placement) {
        return getVariation(placement) === variation;
      }) : basePlacements;
      var allowedPlacements = placements$1.filter(function (placement) {
        return allowedAutoPlacements.indexOf(placement) >= 0;
      });

      if (allowedPlacements.length === 0) {
        allowedPlacements = placements$1;

        if (process.env.NODE_ENV !== "production") {
          console.error(['Popper: The `allowedAutoPlacements` option did not allow any', 'placements. Ensure the `placement` option matches the variation', 'of the allowed placements.', 'For example, "auto" cannot be used to allow "bottom-start".', 'Use "auto-start" instead.'].join(' '));
        }
      } // $FlowFixMe[incompatible-type]: Flow seems to have problems with two array unions...


      var overflows = allowedPlacements.reduce(function (acc, placement) {
        acc[placement] = detectOverflow(state, {
          placement: placement,
          boundary: boundary,
          rootBoundary: rootBoundary,
          padding: padding
        })[getBasePlacement(placement)];
        return acc;
      }, {});
      return Object.keys(overflows).sort(function (a, b) {
        return overflows[a] - overflows[b];
      });
    }

    function getExpandedFallbackPlacements(placement) {
      if (getBasePlacement(placement) === auto) {
        return [];
      }

      var oppositePlacement = getOppositePlacement(placement);
      return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
    }

    function flip(_ref) {
      var state = _ref.state,
          options = _ref.options,
          name = _ref.name;

      if (state.modifiersData[name]._skip) {
        return;
      }

      var _options$mainAxis = options.mainAxis,
          checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
          _options$altAxis = options.altAxis,
          checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis,
          specifiedFallbackPlacements = options.fallbackPlacements,
          padding = options.padding,
          boundary = options.boundary,
          rootBoundary = options.rootBoundary,
          altBoundary = options.altBoundary,
          _options$flipVariatio = options.flipVariations,
          flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio,
          allowedAutoPlacements = options.allowedAutoPlacements;
      var preferredPlacement = state.options.placement;
      var basePlacement = getBasePlacement(preferredPlacement);
      var isBasePlacement = basePlacement === preferredPlacement;
      var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
      var placements = [preferredPlacement].concat(fallbackPlacements).reduce(function (acc, placement) {
        return acc.concat(getBasePlacement(placement) === auto ? computeAutoPlacement(state, {
          placement: placement,
          boundary: boundary,
          rootBoundary: rootBoundary,
          padding: padding,
          flipVariations: flipVariations,
          allowedAutoPlacements: allowedAutoPlacements
        }) : placement);
      }, []);
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var checksMap = new Map();
      var makeFallbackChecks = true;
      var firstFittingPlacement = placements[0];

      for (var i = 0; i < placements.length; i++) {
        var placement = placements[i];

        var _basePlacement = getBasePlacement(placement);

        var isStartVariation = getVariation(placement) === start;
        var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
        var len = isVertical ? 'width' : 'height';
        var overflow = detectOverflow(state, {
          placement: placement,
          boundary: boundary,
          rootBoundary: rootBoundary,
          altBoundary: altBoundary,
          padding: padding
        });
        var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;

        if (referenceRect[len] > popperRect[len]) {
          mainVariationSide = getOppositePlacement(mainVariationSide);
        }

        var altVariationSide = getOppositePlacement(mainVariationSide);
        var checks = [];

        if (checkMainAxis) {
          checks.push(overflow[_basePlacement] <= 0);
        }

        if (checkAltAxis) {
          checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
        }

        if (checks.every(function (check) {
          return check;
        })) {
          firstFittingPlacement = placement;
          makeFallbackChecks = false;
          break;
        }

        checksMap.set(placement, checks);
      }

      if (makeFallbackChecks) {
        // `2` may be desired in some cases – research later
        var numberOfChecks = flipVariations ? 3 : 1;

        var _loop = function _loop(_i) {
          var fittingPlacement = placements.find(function (placement) {
            var checks = checksMap.get(placement);

            if (checks) {
              return checks.slice(0, _i).every(function (check) {
                return check;
              });
            }
          });

          if (fittingPlacement) {
            firstFittingPlacement = fittingPlacement;
            return "break";
          }
        };

        for (var _i = numberOfChecks; _i > 0; _i--) {
          var _ret = _loop(_i);

          if (_ret === "break") break;
        }
      }

      if (state.placement !== firstFittingPlacement) {
        state.modifiersData[name]._skip = true;
        state.placement = firstFittingPlacement;
        state.reset = true;
      }
    } // eslint-disable-next-line import/no-unused-modules


    var flip$1 = {
      name: 'flip',
      enabled: true,
      phase: 'main',
      fn: flip,
      requiresIfExists: ['offset'],
      data: {
        _skip: false
      }
    };

    function getSideOffsets(overflow, rect, preventedOffsets) {
      if (preventedOffsets === void 0) {
        preventedOffsets = {
          x: 0,
          y: 0
        };
      }

      return {
        top: overflow.top - rect.height - preventedOffsets.y,
        right: overflow.right - rect.width + preventedOffsets.x,
        bottom: overflow.bottom - rect.height + preventedOffsets.y,
        left: overflow.left - rect.width - preventedOffsets.x
      };
    }

    function isAnySideFullyClipped(overflow) {
      return [top, right, bottom, left].some(function (side) {
        return overflow[side] >= 0;
      });
    }

    function hide(_ref) {
      var state = _ref.state,
          name = _ref.name;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var preventedOffsets = state.modifiersData.preventOverflow;
      var referenceOverflow = detectOverflow(state, {
        elementContext: 'reference'
      });
      var popperAltOverflow = detectOverflow(state, {
        altBoundary: true
      });
      var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
      var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
      var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
      var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
      state.modifiersData[name] = {
        referenceClippingOffsets: referenceClippingOffsets,
        popperEscapeOffsets: popperEscapeOffsets,
        isReferenceHidden: isReferenceHidden,
        hasPopperEscaped: hasPopperEscaped
      };
      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        'data-popper-reference-hidden': isReferenceHidden,
        'data-popper-escaped': hasPopperEscaped
      });
    } // eslint-disable-next-line import/no-unused-modules


    var hide$1 = {
      name: 'hide',
      enabled: true,
      phase: 'main',
      requiresIfExists: ['preventOverflow'],
      fn: hide
    };

    function distanceAndSkiddingToXY(placement, rects, offset) {
      var basePlacement = getBasePlacement(placement);
      var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;

      var _ref = typeof offset === 'function' ? offset(Object.assign({}, rects, {
        placement: placement
      })) : offset,
          skidding = _ref[0],
          distance = _ref[1];

      skidding = skidding || 0;
      distance = (distance || 0) * invertDistance;
      return [left, right].indexOf(basePlacement) >= 0 ? {
        x: distance,
        y: skidding
      } : {
        x: skidding,
        y: distance
      };
    }

    function offset(_ref2) {
      var state = _ref2.state,
          options = _ref2.options,
          name = _ref2.name;
      var _options$offset = options.offset,
          offset = _options$offset === void 0 ? [0, 0] : _options$offset;
      var data = placements.reduce(function (acc, placement) {
        acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset);
        return acc;
      }, {});
      var _data$state$placement = data[state.placement],
          x = _data$state$placement.x,
          y = _data$state$placement.y;

      if (state.modifiersData.popperOffsets != null) {
        state.modifiersData.popperOffsets.x += x;
        state.modifiersData.popperOffsets.y += y;
      }

      state.modifiersData[name] = data;
    } // eslint-disable-next-line import/no-unused-modules


    var offset$1 = {
      name: 'offset',
      enabled: true,
      phase: 'main',
      requires: ['popperOffsets'],
      fn: offset
    };

    function popperOffsets(_ref) {
      var state = _ref.state,
          name = _ref.name;
      // Offsets are the actual position the popper needs to have to be
      // properly positioned near its reference element
      // This is the most basic placement, and will be adjusted by
      // the modifiers in the next step
      state.modifiersData[name] = computeOffsets({
        reference: state.rects.reference,
        element: state.rects.popper,
        strategy: 'absolute',
        placement: state.placement
      });
    } // eslint-disable-next-line import/no-unused-modules


    var popperOffsets$1 = {
      name: 'popperOffsets',
      enabled: true,
      phase: 'read',
      fn: popperOffsets,
      data: {}
    };

    function getAltAxis(axis) {
      return axis === 'x' ? 'y' : 'x';
    }

    function preventOverflow(_ref) {
      var state = _ref.state,
          options = _ref.options,
          name = _ref.name;
      var _options$mainAxis = options.mainAxis,
          checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis,
          _options$altAxis = options.altAxis,
          checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis,
          boundary = options.boundary,
          rootBoundary = options.rootBoundary,
          altBoundary = options.altBoundary,
          padding = options.padding,
          _options$tether = options.tether,
          tether = _options$tether === void 0 ? true : _options$tether,
          _options$tetherOffset = options.tetherOffset,
          tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
      var overflow = detectOverflow(state, {
        boundary: boundary,
        rootBoundary: rootBoundary,
        padding: padding,
        altBoundary: altBoundary
      });
      var basePlacement = getBasePlacement(state.placement);
      var variation = getVariation(state.placement);
      var isBasePlacement = !variation;
      var mainAxis = getMainAxisFromPlacement(basePlacement);
      var altAxis = getAltAxis(mainAxis);
      var popperOffsets = state.modifiersData.popperOffsets;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var tetherOffsetValue = typeof tetherOffset === 'function' ? tetherOffset(Object.assign({}, state.rects, {
        placement: state.placement
      })) : tetherOffset;
      var normalizedTetherOffsetValue = typeof tetherOffsetValue === 'number' ? {
        mainAxis: tetherOffsetValue,
        altAxis: tetherOffsetValue
      } : Object.assign({
        mainAxis: 0,
        altAxis: 0
      }, tetherOffsetValue);
      var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
      var data = {
        x: 0,
        y: 0
      };

      if (!popperOffsets) {
        return;
      }

      if (checkMainAxis) {
        var _offsetModifierState$;

        var mainSide = mainAxis === 'y' ? top : left;
        var altSide = mainAxis === 'y' ? bottom : right;
        var len = mainAxis === 'y' ? 'height' : 'width';
        var offset = popperOffsets[mainAxis];
        var min$1 = offset + overflow[mainSide];
        var max$1 = offset - overflow[altSide];
        var additive = tether ? -popperRect[len] / 2 : 0;
        var minLen = variation === start ? referenceRect[len] : popperRect[len];
        var maxLen = variation === start ? -popperRect[len] : -referenceRect[len]; // We need to include the arrow in the calculation so the arrow doesn't go
        // outside the reference bounds

        var arrowElement = state.elements.arrow;
        var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
          width: 0,
          height: 0
        };
        var arrowPaddingObject = state.modifiersData['arrow#persistent'] ? state.modifiersData['arrow#persistent'].padding : getFreshSideObject();
        var arrowPaddingMin = arrowPaddingObject[mainSide];
        var arrowPaddingMax = arrowPaddingObject[altSide]; // If the reference length is smaller than the arrow length, we don't want
        // to include its full size in the calculation. If the reference is small
        // and near the edge of a boundary, the popper can overflow even if the
        // reference is not overflowing as well (e.g. virtual elements with no
        // width or height)

        var arrowLen = within(0, referenceRect[len], arrowRect[len]);
        var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
        var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
        var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
        var clientOffset = arrowOffsetParent ? mainAxis === 'y' ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
        var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
        var tetherMin = offset + minOffset - offsetModifierValue - clientOffset;
        var tetherMax = offset + maxOffset - offsetModifierValue;
        var preventedOffset = within(tether ? min(min$1, tetherMin) : min$1, offset, tether ? max(max$1, tetherMax) : max$1);
        popperOffsets[mainAxis] = preventedOffset;
        data[mainAxis] = preventedOffset - offset;
      }

      if (checkAltAxis) {
        var _offsetModifierState$2;

        var _mainSide = mainAxis === 'x' ? top : left;

        var _altSide = mainAxis === 'x' ? bottom : right;

        var _offset = popperOffsets[altAxis];

        var _len = altAxis === 'y' ? 'height' : 'width';

        var _min = _offset + overflow[_mainSide];

        var _max = _offset - overflow[_altSide];

        var isOriginSide = [top, left].indexOf(basePlacement) !== -1;

        var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;

        var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;

        var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;

        var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);

        popperOffsets[altAxis] = _preventedOffset;
        data[altAxis] = _preventedOffset - _offset;
      }

      state.modifiersData[name] = data;
    } // eslint-disable-next-line import/no-unused-modules


    var preventOverflow$1 = {
      name: 'preventOverflow',
      enabled: true,
      phase: 'main',
      fn: preventOverflow,
      requiresIfExists: ['offset']
    };

    function getHTMLElementScroll(element) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }

    function getNodeScroll(node) {
      if (node === getWindow(node) || !isHTMLElement(node)) {
        return getWindowScroll(node);
      } else {
        return getHTMLElementScroll(node);
      }
    }

    function isElementScaled(element) {
      var rect = element.getBoundingClientRect();
      var scaleX = round(rect.width) / element.offsetWidth || 1;
      var scaleY = round(rect.height) / element.offsetHeight || 1;
      return scaleX !== 1 || scaleY !== 1;
    } // Returns the composite rect of an element relative to its offsetParent.
    // Composite means it takes into account transforms as well as layout.


    function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
      if (isFixed === void 0) {
        isFixed = false;
      }

      var isOffsetParentAnElement = isHTMLElement(offsetParent);
      var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
      var documentElement = getDocumentElement(offsetParent);
      var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled);
      var scroll = {
        scrollLeft: 0,
        scrollTop: 0
      };
      var offsets = {
        x: 0,
        y: 0
      };

      if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
        if (getNodeName(offsetParent) !== 'body' || // https://github.com/popperjs/popper-core/issues/1078
        isScrollParent(documentElement)) {
          scroll = getNodeScroll(offsetParent);
        }

        if (isHTMLElement(offsetParent)) {
          offsets = getBoundingClientRect(offsetParent, true);
          offsets.x += offsetParent.clientLeft;
          offsets.y += offsetParent.clientTop;
        } else if (documentElement) {
          offsets.x = getWindowScrollBarX(documentElement);
        }
      }

      return {
        x: rect.left + scroll.scrollLeft - offsets.x,
        y: rect.top + scroll.scrollTop - offsets.y,
        width: rect.width,
        height: rect.height
      };
    }

    function order(modifiers) {
      var map = new Map();
      var visited = new Set();
      var result = [];
      modifiers.forEach(function (modifier) {
        map.set(modifier.name, modifier);
      }); // On visiting object, check for its dependencies and visit them recursively

      function sort(modifier) {
        visited.add(modifier.name);
        var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
        requires.forEach(function (dep) {
          if (!visited.has(dep)) {
            var depModifier = map.get(dep);

            if (depModifier) {
              sort(depModifier);
            }
          }
        });
        result.push(modifier);
      }

      modifiers.forEach(function (modifier) {
        if (!visited.has(modifier.name)) {
          // check for visited object
          sort(modifier);
        }
      });
      return result;
    }

    function orderModifiers(modifiers) {
      // order based on dependencies
      var orderedModifiers = order(modifiers); // order based on phase

      return modifierPhases.reduce(function (acc, phase) {
        return acc.concat(orderedModifiers.filter(function (modifier) {
          return modifier.phase === phase;
        }));
      }, []);
    }

    function debounce(fn) {
      var pending;
      return function () {
        if (!pending) {
          pending = new Promise(function (resolve) {
            Promise.resolve().then(function () {
              pending = undefined;
              resolve(fn());
            });
          });
        }

        return pending;
      };
    }

    function format(str) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return [].concat(args).reduce(function (p, c) {
        return p.replace(/%s/, c);
      }, str);
    }

    var INVALID_MODIFIER_ERROR = 'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
    var MISSING_DEPENDENCY_ERROR = 'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
    var VALID_PROPERTIES = ['name', 'enabled', 'phase', 'fn', 'effect', 'requires', 'options'];
    function validateModifiers(modifiers) {
      modifiers.forEach(function (modifier) {
        [].concat(Object.keys(modifier), VALID_PROPERTIES) // IE11-compatible replacement for `new Set(iterable)`
        .filter(function (value, index, self) {
          return self.indexOf(value) === index;
        }).forEach(function (key) {
          switch (key) {
            case 'name':
              if (typeof modifier.name !== 'string') {
                console.error(format(INVALID_MODIFIER_ERROR, String(modifier.name), '"name"', '"string"', "\"" + String(modifier.name) + "\""));
              }

              break;

            case 'enabled':
              if (typeof modifier.enabled !== 'boolean') {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"enabled"', '"boolean"', "\"" + String(modifier.enabled) + "\""));
              }

              break;

            case 'phase':
              if (modifierPhases.indexOf(modifier.phase) < 0) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"phase"', "either " + modifierPhases.join(', '), "\"" + String(modifier.phase) + "\""));
              }

              break;

            case 'fn':
              if (typeof modifier.fn !== 'function') {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"fn"', '"function"', "\"" + String(modifier.fn) + "\""));
              }

              break;

            case 'effect':
              if (modifier.effect != null && typeof modifier.effect !== 'function') {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"effect"', '"function"', "\"" + String(modifier.fn) + "\""));
              }

              break;

            case 'requires':
              if (modifier.requires != null && !Array.isArray(modifier.requires)) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requires"', '"array"', "\"" + String(modifier.requires) + "\""));
              }

              break;

            case 'requiresIfExists':
              if (!Array.isArray(modifier.requiresIfExists)) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requiresIfExists"', '"array"', "\"" + String(modifier.requiresIfExists) + "\""));
              }

              break;

            case 'options':
            case 'data':
              break;

            default:
              console.error("PopperJS: an invalid property has been provided to the \"" + modifier.name + "\" modifier, valid properties are " + VALID_PROPERTIES.map(function (s) {
                return "\"" + s + "\"";
              }).join(', ') + "; but \"" + key + "\" was provided.");
          }

          modifier.requires && modifier.requires.forEach(function (requirement) {
            if (modifiers.find(function (mod) {
              return mod.name === requirement;
            }) == null) {
              console.error(format(MISSING_DEPENDENCY_ERROR, String(modifier.name), requirement, requirement));
            }
          });
        });
      });
    }

    function uniqueBy(arr, fn) {
      var identifiers = new Set();
      return arr.filter(function (item) {
        var identifier = fn(item);

        if (!identifiers.has(identifier)) {
          identifiers.add(identifier);
          return true;
        }
      });
    }

    function mergeByName(modifiers) {
      var merged = modifiers.reduce(function (merged, current) {
        var existing = merged[current.name];
        merged[current.name] = existing ? Object.assign({}, existing, current, {
          options: Object.assign({}, existing.options, current.options),
          data: Object.assign({}, existing.data, current.data)
        }) : current;
        return merged;
      }, {}); // IE11 does not support Object.values

      return Object.keys(merged).map(function (key) {
        return merged[key];
      });
    }

    var INVALID_ELEMENT_ERROR = 'Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.';
    var INFINITE_LOOP_ERROR = 'Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.';
    var DEFAULT_OPTIONS = {
      placement: 'bottom',
      modifiers: [],
      strategy: 'absolute'
    };

    function areValidElements() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return !args.some(function (element) {
        return !(element && typeof element.getBoundingClientRect === 'function');
      });
    }

    function popperGenerator(generatorOptions) {
      if (generatorOptions === void 0) {
        generatorOptions = {};
      }

      var _generatorOptions = generatorOptions,
          _generatorOptions$def = _generatorOptions.defaultModifiers,
          defaultModifiers = _generatorOptions$def === void 0 ? [] : _generatorOptions$def,
          _generatorOptions$def2 = _generatorOptions.defaultOptions,
          defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
      return function createPopper(reference, popper, options) {
        if (options === void 0) {
          options = defaultOptions;
        }

        var state = {
          placement: 'bottom',
          orderedModifiers: [],
          options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
          modifiersData: {},
          elements: {
            reference: reference,
            popper: popper
          },
          attributes: {},
          styles: {}
        };
        var effectCleanupFns = [];
        var isDestroyed = false;
        var instance = {
          state: state,
          setOptions: function setOptions(setOptionsAction) {
            var options = typeof setOptionsAction === 'function' ? setOptionsAction(state.options) : setOptionsAction;
            cleanupModifierEffects();
            state.options = Object.assign({}, defaultOptions, state.options, options);
            state.scrollParents = {
              reference: isElement(reference) ? listScrollParents(reference) : reference.contextElement ? listScrollParents(reference.contextElement) : [],
              popper: listScrollParents(popper)
            }; // Orders the modifiers based on their dependencies and `phase`
            // properties

            var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers, state.options.modifiers))); // Strip out disabled modifiers

            state.orderedModifiers = orderedModifiers.filter(function (m) {
              return m.enabled;
            }); // Validate the provided modifiers so that the consumer will get warned
            // if one of the modifiers is invalid for any reason

            if (process.env.NODE_ENV !== "production") {
              var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function (_ref) {
                var name = _ref.name;
                return name;
              });
              validateModifiers(modifiers);

              if (getBasePlacement(state.options.placement) === auto) {
                var flipModifier = state.orderedModifiers.find(function (_ref2) {
                  var name = _ref2.name;
                  return name === 'flip';
                });

                if (!flipModifier) {
                  console.error(['Popper: "auto" placements require the "flip" modifier be', 'present and enabled to work.'].join(' '));
                }
              }

              var _getComputedStyle = getComputedStyle$1(popper),
                  marginTop = _getComputedStyle.marginTop,
                  marginRight = _getComputedStyle.marginRight,
                  marginBottom = _getComputedStyle.marginBottom,
                  marginLeft = _getComputedStyle.marginLeft; // We no longer take into account `margins` on the popper, and it can
              // cause bugs with positioning, so we'll warn the consumer


              if ([marginTop, marginRight, marginBottom, marginLeft].some(function (margin) {
                return parseFloat(margin);
              })) {
                console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', 'between the popper and its reference element or boundary.', 'To replicate margin, use the `offset` modifier, as well as', 'the `padding` option in the `preventOverflow` and `flip`', 'modifiers.'].join(' '));
              }
            }

            runModifierEffects();
            return instance.update();
          },
          // Sync update – it will always be executed, even if not necessary. This
          // is useful for low frequency updates where sync behavior simplifies the
          // logic.
          // For high frequency updates (e.g. `resize` and `scroll` events), always
          // prefer the async Popper#update method
          forceUpdate: function forceUpdate() {
            if (isDestroyed) {
              return;
            }

            var _state$elements = state.elements,
                reference = _state$elements.reference,
                popper = _state$elements.popper; // Don't proceed if `reference` or `popper` are not valid elements
            // anymore

            if (!areValidElements(reference, popper)) {
              if (process.env.NODE_ENV !== "production") {
                console.error(INVALID_ELEMENT_ERROR);
              }

              return;
            } // Store the reference and popper rects to be read by modifiers


            state.rects = {
              reference: getCompositeRect(reference, getOffsetParent(popper), state.options.strategy === 'fixed'),
              popper: getLayoutRect(popper)
            }; // Modifiers have the ability to reset the current update cycle. The
            // most common use case for this is the `flip` modifier changing the
            // placement, which then needs to re-run all the modifiers, because the
            // logic was previously ran for the previous placement and is therefore
            // stale/incorrect

            state.reset = false;
            state.placement = state.options.placement; // On each update cycle, the `modifiersData` property for each modifier
            // is filled with the initial data specified by the modifier. This means
            // it doesn't persist and is fresh on each update.
            // To ensure persistent data, use `${name}#persistent`

            state.orderedModifiers.forEach(function (modifier) {
              return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
            });
            var __debug_loops__ = 0;

            for (var index = 0; index < state.orderedModifiers.length; index++) {
              if (process.env.NODE_ENV !== "production") {
                __debug_loops__ += 1;

                if (__debug_loops__ > 100) {
                  console.error(INFINITE_LOOP_ERROR);
                  break;
                }
              }

              if (state.reset === true) {
                state.reset = false;
                index = -1;
                continue;
              }

              var _state$orderedModifie = state.orderedModifiers[index],
                  fn = _state$orderedModifie.fn,
                  _state$orderedModifie2 = _state$orderedModifie.options,
                  _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2,
                  name = _state$orderedModifie.name;

              if (typeof fn === 'function') {
                state = fn({
                  state: state,
                  options: _options,
                  name: name,
                  instance: instance
                }) || state;
              }
            }
          },
          // Async and optimistically optimized update – it will not be executed if
          // not necessary (debounced to run at most once-per-tick)
          update: debounce(function () {
            return new Promise(function (resolve) {
              instance.forceUpdate();
              resolve(state);
            });
          }),
          destroy: function destroy() {
            cleanupModifierEffects();
            isDestroyed = true;
          }
        };

        if (!areValidElements(reference, popper)) {
          if (process.env.NODE_ENV !== "production") {
            console.error(INVALID_ELEMENT_ERROR);
          }

          return instance;
        }

        instance.setOptions(options).then(function (state) {
          if (!isDestroyed && options.onFirstUpdate) {
            options.onFirstUpdate(state);
          }
        }); // Modifiers have the ability to execute arbitrary code before the first
        // update cycle runs. They will be executed in the same order as the update
        // cycle. This is useful when a modifier adds some persistent data that
        // other modifiers need to use, but the modifier is run after the dependent
        // one.

        function runModifierEffects() {
          state.orderedModifiers.forEach(function (_ref3) {
            var name = _ref3.name,
                _ref3$options = _ref3.options,
                options = _ref3$options === void 0 ? {} : _ref3$options,
                effect = _ref3.effect;

            if (typeof effect === 'function') {
              var cleanupFn = effect({
                state: state,
                name: name,
                instance: instance,
                options: options
              });

              var noopFn = function noopFn() {};

              effectCleanupFns.push(cleanupFn || noopFn);
            }
          });
        }

        function cleanupModifierEffects() {
          effectCleanupFns.forEach(function (fn) {
            return fn();
          });
          effectCleanupFns = [];
        }

        return instance;
      };
    }
    var createPopper$2 = /*#__PURE__*/popperGenerator(); // eslint-disable-next-line import/no-unused-modules

    var defaultModifiers$1 = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1];
    var createPopper$1 = /*#__PURE__*/popperGenerator({
      defaultModifiers: defaultModifiers$1
    }); // eslint-disable-next-line import/no-unused-modules

    var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
    var createPopper = /*#__PURE__*/popperGenerator({
      defaultModifiers: defaultModifiers
    }); // eslint-disable-next-line import/no-unused-modules

    var lib = /*#__PURE__*/Object.freeze({
        __proto__: null,
        popperGenerator: popperGenerator,
        detectOverflow: detectOverflow,
        createPopperBase: createPopper$2,
        createPopper: createPopper,
        createPopperLite: createPopper$1,
        top: top,
        bottom: bottom,
        right: right,
        left: left,
        auto: auto,
        basePlacements: basePlacements,
        start: start,
        end: end,
        clippingParents: clippingParents,
        viewport: viewport,
        popper: popper,
        reference: reference,
        variationPlacements: variationPlacements,
        placements: placements,
        beforeRead: beforeRead,
        read: read,
        afterRead: afterRead,
        beforeMain: beforeMain,
        main: main$1,
        afterMain: afterMain,
        beforeWrite: beforeWrite,
        write: write,
        afterWrite: afterWrite,
        modifierPhases: modifierPhases,
        applyStyles: applyStyles$1,
        arrow: arrow$1,
        computeStyles: computeStyles$1,
        eventListeners: eventListeners,
        flip: flip$1,
        hide: hide$1,
        offset: offset$1,
        popperOffsets: popperOffsets$1,
        preventOverflow: preventOverflow$1
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(lib);

    var eventHandler = {exports: {}};

    /*!
      * Bootstrap event-handler.js v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    (function (module, exports) {
    (function (global, factory) {
      module.exports = factory() ;
    })(commonjsGlobal, (function () {
      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): util/index.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */

      const getjQuery = () => {
        const {
          jQuery
        } = window;

        if (jQuery && !document.body.hasAttribute('data-bs-no-jquery')) {
          return jQuery;
        }

        return null;
      };

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): dom/event-handler.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */
      /**
       * ------------------------------------------------------------------------
       * Constants
       * ------------------------------------------------------------------------
       */

      const namespaceRegex = /[^.]*(?=\..*)\.|.*/;
      const stripNameRegex = /\..*/;
      const stripUidRegex = /::\d+$/;
      const eventRegistry = {}; // Events storage

      let uidEvent = 1;
      const customEvents = {
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
      };
      const customEventsRegex = /^(mouseenter|mouseleave)/i;
      const nativeEvents = new Set(['click', 'dblclick', 'mouseup', 'mousedown', 'contextmenu', 'mousewheel', 'DOMMouseScroll', 'mouseover', 'mouseout', 'mousemove', 'selectstart', 'selectend', 'keydown', 'keypress', 'keyup', 'orientationchange', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointermove', 'pointerup', 'pointerleave', 'pointercancel', 'gesturestart', 'gesturechange', 'gestureend', 'focus', 'blur', 'change', 'reset', 'select', 'submit', 'focusin', 'focusout', 'load', 'unload', 'beforeunload', 'resize', 'move', 'DOMContentLoaded', 'readystatechange', 'error', 'abort', 'scroll']);
      /**
       * ------------------------------------------------------------------------
       * Private methods
       * ------------------------------------------------------------------------
       */

      function getUidEvent(element, uid) {
        return uid && `${uid}::${uidEvent++}` || element.uidEvent || uidEvent++;
      }

      function getEvent(element) {
        const uid = getUidEvent(element);
        element.uidEvent = uid;
        eventRegistry[uid] = eventRegistry[uid] || {};
        return eventRegistry[uid];
      }

      function bootstrapHandler(element, fn) {
        return function handler(event) {
          event.delegateTarget = element;

          if (handler.oneOff) {
            EventHandler.off(element, event.type, fn);
          }

          return fn.apply(element, [event]);
        };
      }

      function bootstrapDelegationHandler(element, selector, fn) {
        return function handler(event) {
          const domElements = element.querySelectorAll(selector);

          for (let {
            target
          } = event; target && target !== this; target = target.parentNode) {
            for (let i = domElements.length; i--;) {
              if (domElements[i] === target) {
                event.delegateTarget = target;

                if (handler.oneOff) {
                  EventHandler.off(element, event.type, selector, fn);
                }

                return fn.apply(target, [event]);
              }
            }
          } // To please ESLint


          return null;
        };
      }

      function findHandler(events, handler, delegationSelector = null) {
        const uidEventList = Object.keys(events);

        for (let i = 0, len = uidEventList.length; i < len; i++) {
          const event = events[uidEventList[i]];

          if (event.originalHandler === handler && event.delegationSelector === delegationSelector) {
            return event;
          }
        }

        return null;
      }

      function normalizeParams(originalTypeEvent, handler, delegationFn) {
        const delegation = typeof handler === 'string';
        const originalHandler = delegation ? delegationFn : handler;
        let typeEvent = getTypeEvent(originalTypeEvent);
        const isNative = nativeEvents.has(typeEvent);

        if (!isNative) {
          typeEvent = originalTypeEvent;
        }

        return [delegation, originalHandler, typeEvent];
      }

      function addHandler(element, originalTypeEvent, handler, delegationFn, oneOff) {
        if (typeof originalTypeEvent !== 'string' || !element) {
          return;
        }

        if (!handler) {
          handler = delegationFn;
          delegationFn = null;
        } // in case of mouseenter or mouseleave wrap the handler within a function that checks for its DOM position
        // this prevents the handler from being dispatched the same way as mouseover or mouseout does


        if (customEventsRegex.test(originalTypeEvent)) {
          const wrapFn = fn => {
            return function (event) {
              if (!event.relatedTarget || event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget)) {
                return fn.call(this, event);
              }
            };
          };

          if (delegationFn) {
            delegationFn = wrapFn(delegationFn);
          } else {
            handler = wrapFn(handler);
          }
        }

        const [delegation, originalHandler, typeEvent] = normalizeParams(originalTypeEvent, handler, delegationFn);
        const events = getEvent(element);
        const handlers = events[typeEvent] || (events[typeEvent] = {});
        const previousFn = findHandler(handlers, originalHandler, delegation ? handler : null);

        if (previousFn) {
          previousFn.oneOff = previousFn.oneOff && oneOff;
          return;
        }

        const uid = getUidEvent(originalHandler, originalTypeEvent.replace(namespaceRegex, ''));
        const fn = delegation ? bootstrapDelegationHandler(element, handler, delegationFn) : bootstrapHandler(element, handler);
        fn.delegationSelector = delegation ? handler : null;
        fn.originalHandler = originalHandler;
        fn.oneOff = oneOff;
        fn.uidEvent = uid;
        handlers[uid] = fn;
        element.addEventListener(typeEvent, fn, delegation);
      }

      function removeHandler(element, events, typeEvent, handler, delegationSelector) {
        const fn = findHandler(events[typeEvent], handler, delegationSelector);

        if (!fn) {
          return;
        }

        element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
        delete events[typeEvent][fn.uidEvent];
      }

      function removeNamespacedHandlers(element, events, typeEvent, namespace) {
        const storeElementEvent = events[typeEvent] || {};
        Object.keys(storeElementEvent).forEach(handlerKey => {
          if (handlerKey.includes(namespace)) {
            const event = storeElementEvent[handlerKey];
            removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
          }
        });
      }

      function getTypeEvent(event) {
        // allow to get the native events from namespaced events ('click.bs.button' --> 'click')
        event = event.replace(stripNameRegex, '');
        return customEvents[event] || event;
      }

      const EventHandler = {
        on(element, event, handler, delegationFn) {
          addHandler(element, event, handler, delegationFn, false);
        },

        one(element, event, handler, delegationFn) {
          addHandler(element, event, handler, delegationFn, true);
        },

        off(element, originalTypeEvent, handler, delegationFn) {
          if (typeof originalTypeEvent !== 'string' || !element) {
            return;
          }

          const [delegation, originalHandler, typeEvent] = normalizeParams(originalTypeEvent, handler, delegationFn);
          const inNamespace = typeEvent !== originalTypeEvent;
          const events = getEvent(element);
          const isNamespace = originalTypeEvent.startsWith('.');

          if (typeof originalHandler !== 'undefined') {
            // Simplest case: handler is passed, remove that listener ONLY.
            if (!events || !events[typeEvent]) {
              return;
            }

            removeHandler(element, events, typeEvent, originalHandler, delegation ? handler : null);
            return;
          }

          if (isNamespace) {
            Object.keys(events).forEach(elementEvent => {
              removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
            });
          }

          const storeElementEvent = events[typeEvent] || {};
          Object.keys(storeElementEvent).forEach(keyHandlers => {
            const handlerKey = keyHandlers.replace(stripUidRegex, '');

            if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
              const event = storeElementEvent[keyHandlers];
              removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
            }
          });
        },

        trigger(element, event, args) {
          if (typeof event !== 'string' || !element) {
            return null;
          }

          const $ = getjQuery();
          const typeEvent = getTypeEvent(event);
          const inNamespace = event !== typeEvent;
          const isNative = nativeEvents.has(typeEvent);
          let jQueryEvent;
          let bubbles = true;
          let nativeDispatch = true;
          let defaultPrevented = false;
          let evt = null;

          if (inNamespace && $) {
            jQueryEvent = $.Event(event, args);
            $(element).trigger(jQueryEvent);
            bubbles = !jQueryEvent.isPropagationStopped();
            nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
            defaultPrevented = jQueryEvent.isDefaultPrevented();
          }

          if (isNative) {
            evt = document.createEvent('HTMLEvents');
            evt.initEvent(typeEvent, bubbles, true);
          } else {
            evt = new CustomEvent(event, {
              bubbles,
              cancelable: true
            });
          } // merge custom information in our event


          if (typeof args !== 'undefined') {
            Object.keys(args).forEach(key => {
              Object.defineProperty(evt, key, {
                get() {
                  return args[key];
                }

              });
            });
          }

          if (defaultPrevented) {
            evt.preventDefault();
          }

          if (nativeDispatch) {
            element.dispatchEvent(evt);
          }

          if (evt.defaultPrevented && typeof jQueryEvent !== 'undefined') {
            jQueryEvent.preventDefault();
          }

          return evt;
        }

      };

      return EventHandler;

    }));

    }(eventHandler));

    var manipulator = {exports: {}};

    /*!
      * Bootstrap manipulator.js v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    (function (module, exports) {
    (function (global, factory) {
      module.exports = factory() ;
    })(commonjsGlobal, (function () {
      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): dom/manipulator.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */
      function normalizeData(val) {
        if (val === 'true') {
          return true;
        }

        if (val === 'false') {
          return false;
        }

        if (val === Number(val).toString()) {
          return Number(val);
        }

        if (val === '' || val === 'null') {
          return null;
        }

        return val;
      }

      function normalizeDataKey(key) {
        return key.replace(/[A-Z]/g, chr => `-${chr.toLowerCase()}`);
      }

      const Manipulator = {
        setDataAttribute(element, key, value) {
          element.setAttribute(`data-bs-${normalizeDataKey(key)}`, value);
        },

        removeDataAttribute(element, key) {
          element.removeAttribute(`data-bs-${normalizeDataKey(key)}`);
        },

        getDataAttributes(element) {
          if (!element) {
            return {};
          }

          const attributes = {};
          Object.keys(element.dataset).filter(key => key.startsWith('bs')).forEach(key => {
            let pureKey = key.replace(/^bs/, '');
            pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1, pureKey.length);
            attributes[pureKey] = normalizeData(element.dataset[key]);
          });
          return attributes;
        },

        getDataAttribute(element, key) {
          return normalizeData(element.getAttribute(`data-bs-${normalizeDataKey(key)}`));
        },

        offset(element) {
          const rect = element.getBoundingClientRect();
          return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset
          };
        },

        position(element) {
          return {
            top: element.offsetTop,
            left: element.offsetLeft
          };
        }

      };

      return Manipulator;

    }));

    }(manipulator));

    var selectorEngine = {exports: {}};

    /*!
      * Bootstrap selector-engine.js v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    (function (module, exports) {
    (function (global, factory) {
      module.exports = factory() ;
    })(commonjsGlobal, (function () {
      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): util/index.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */

      const isElement = obj => {
        if (!obj || typeof obj !== 'object') {
          return false;
        }

        if (typeof obj.jquery !== 'undefined') {
          obj = obj[0];
        }

        return typeof obj.nodeType !== 'undefined';
      };

      const isVisible = element => {
        if (!isElement(element) || element.getClientRects().length === 0) {
          return false;
        }

        return getComputedStyle(element).getPropertyValue('visibility') === 'visible';
      };

      const isDisabled = element => {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
          return true;
        }

        if (element.classList.contains('disabled')) {
          return true;
        }

        if (typeof element.disabled !== 'undefined') {
          return element.disabled;
        }

        return element.hasAttribute('disabled') && element.getAttribute('disabled') !== 'false';
      };

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): dom/selector-engine.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */
      const NODE_TEXT = 3;
      const SelectorEngine = {
        find(selector, element = document.documentElement) {
          return [].concat(...Element.prototype.querySelectorAll.call(element, selector));
        },

        findOne(selector, element = document.documentElement) {
          return Element.prototype.querySelector.call(element, selector);
        },

        children(element, selector) {
          return [].concat(...element.children).filter(child => child.matches(selector));
        },

        parents(element, selector) {
          const parents = [];
          let ancestor = element.parentNode;

          while (ancestor && ancestor.nodeType === Node.ELEMENT_NODE && ancestor.nodeType !== NODE_TEXT) {
            if (ancestor.matches(selector)) {
              parents.push(ancestor);
            }

            ancestor = ancestor.parentNode;
          }

          return parents;
        },

        prev(element, selector) {
          let previous = element.previousElementSibling;

          while (previous) {
            if (previous.matches(selector)) {
              return [previous];
            }

            previous = previous.previousElementSibling;
          }

          return [];
        },

        next(element, selector) {
          let next = element.nextElementSibling;

          while (next) {
            if (next.matches(selector)) {
              return [next];
            }

            next = next.nextElementSibling;
          }

          return [];
        },

        focusableChildren(element) {
          const focusables = ['a', 'button', 'input', 'textarea', 'select', 'details', '[tabindex]', '[contenteditable="true"]'].map(selector => `${selector}:not([tabindex^="-"])`).join(', ');
          return this.find(focusables, element).filter(el => !isDisabled(el) && isVisible(el));
        }

      };

      return SelectorEngine;

    }));

    }(selectorEngine));

    var baseComponent = {exports: {}};

    var data = {exports: {}};

    /*!
      * Bootstrap data.js v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    (function (module, exports) {
    (function (global, factory) {
      module.exports = factory() ;
    })(commonjsGlobal, (function () {
      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): dom/data.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */

      /**
       * ------------------------------------------------------------------------
       * Constants
       * ------------------------------------------------------------------------
       */
      const elementMap = new Map();
      const data = {
        set(element, key, instance) {
          if (!elementMap.has(element)) {
            elementMap.set(element, new Map());
          }

          const instanceMap = elementMap.get(element); // make it clear we only want one instance per element
          // can be removed later when multiple key/instances are fine to be used

          if (!instanceMap.has(key) && instanceMap.size !== 0) {
            // eslint-disable-next-line no-console
            console.error(`Bootstrap doesn't allow more than one instance per element. Bound instance: ${Array.from(instanceMap.keys())[0]}.`);
            return;
          }

          instanceMap.set(key, instance);
        },

        get(element, key) {
          if (elementMap.has(element)) {
            return elementMap.get(element).get(key) || null;
          }

          return null;
        },

        remove(element, key) {
          if (!elementMap.has(element)) {
            return;
          }

          const instanceMap = elementMap.get(element);
          instanceMap.delete(key); // free up element references if there are no instances left for an element

          if (instanceMap.size === 0) {
            elementMap.delete(element);
          }
        }

      };

      return data;

    }));

    }(data));

    /*!
      * Bootstrap base-component.js v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    (function (module, exports) {
    (function (global, factory) {
      module.exports = factory(data.exports, eventHandler.exports) ;
    })(commonjsGlobal, (function (Data, EventHandler) {
      const _interopDefaultLegacy = e => e && typeof e === 'object' && 'default' in e ? e : { default: e };

      const Data__default = /*#__PURE__*/_interopDefaultLegacy(Data);
      const EventHandler__default = /*#__PURE__*/_interopDefaultLegacy(EventHandler);

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): util/index.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */
      const MILLISECONDS_MULTIPLIER = 1000;
      const TRANSITION_END = 'transitionend'; // Shoutout AngusCroll (https://goo.gl/pxwQGp)

      const getTransitionDurationFromElement = element => {
        if (!element) {
          return 0;
        } // Get transition-duration of the element


        let {
          transitionDuration,
          transitionDelay
        } = window.getComputedStyle(element);
        const floatTransitionDuration = Number.parseFloat(transitionDuration);
        const floatTransitionDelay = Number.parseFloat(transitionDelay); // Return 0 if element or transition duration is not found

        if (!floatTransitionDuration && !floatTransitionDelay) {
          return 0;
        } // If multiple durations are defined, take the first


        transitionDuration = transitionDuration.split(',')[0];
        transitionDelay = transitionDelay.split(',')[0];
        return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
      };

      const triggerTransitionEnd = element => {
        element.dispatchEvent(new Event(TRANSITION_END));
      };

      const isElement = obj => {
        if (!obj || typeof obj !== 'object') {
          return false;
        }

        if (typeof obj.jquery !== 'undefined') {
          obj = obj[0];
        }

        return typeof obj.nodeType !== 'undefined';
      };

      const getElement = obj => {
        if (isElement(obj)) {
          // it's a jQuery object or a node element
          return obj.jquery ? obj[0] : obj;
        }

        if (typeof obj === 'string' && obj.length > 0) {
          return document.querySelector(obj);
        }

        return null;
      };

      const execute = callback => {
        if (typeof callback === 'function') {
          callback();
        }
      };

      const executeAfterTransition = (callback, transitionElement, waitForTransition = true) => {
        if (!waitForTransition) {
          execute(callback);
          return;
        }

        const durationPadding = 5;
        const emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
        let called = false;

        const handler = ({
          target
        }) => {
          if (target !== transitionElement) {
            return;
          }

          called = true;
          transitionElement.removeEventListener(TRANSITION_END, handler);
          execute(callback);
        };

        transitionElement.addEventListener(TRANSITION_END, handler);
        setTimeout(() => {
          if (!called) {
            triggerTransitionEnd(transitionElement);
          }
        }, emulatedDuration);
      };

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): base-component.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */
      /**
       * ------------------------------------------------------------------------
       * Constants
       * ------------------------------------------------------------------------
       */

      const VERSION = '5.1.3';

      class BaseComponent {
        constructor(element) {
          element = getElement(element);

          if (!element) {
            return;
          }

          this._element = element;
          Data__default.default.set(this._element, this.constructor.DATA_KEY, this);
        }

        dispose() {
          Data__default.default.remove(this._element, this.constructor.DATA_KEY);
          EventHandler__default.default.off(this._element, this.constructor.EVENT_KEY);
          Object.getOwnPropertyNames(this).forEach(propertyName => {
            this[propertyName] = null;
          });
        }

        _queueCallback(callback, element, isAnimated = true) {
          executeAfterTransition(callback, element, isAnimated);
        }
        /** Static */


        static getInstance(element) {
          return Data__default.default.get(getElement(element), this.DATA_KEY);
        }

        static getOrCreateInstance(element, config = {}) {
          return this.getInstance(element) || new this(element, typeof config === 'object' ? config : null);
        }

        static get VERSION() {
          return VERSION;
        }

        static get NAME() {
          throw new Error('You have to implement the static method "NAME", for each component!');
        }

        static get DATA_KEY() {
          return `bs.${this.NAME}`;
        }

        static get EVENT_KEY() {
          return `.${this.DATA_KEY}`;
        }

      }

      return BaseComponent;

    }));

    }(baseComponent));

    /*!
      * Bootstrap dropdown.js v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    (function (module, exports) {
    (function (global, factory) {
      module.exports = factory(require$$0, eventHandler.exports, manipulator.exports, selectorEngine.exports, baseComponent.exports) ;
    })(commonjsGlobal, (function (Popper, EventHandler, Manipulator, SelectorEngine, BaseComponent) {
      const _interopDefaultLegacy = e => e && typeof e === 'object' && 'default' in e ? e : { default: e };

      function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        const n = Object.create(null);
        if (e) {
          for (const k in e) {
            if (k !== 'default') {
              const d = Object.getOwnPropertyDescriptor(e, k);
              Object.defineProperty(n, k, d.get ? d : {
                enumerable: true,
                get: () => e[k]
              });
            }
          }
        }
        n.default = e;
        return Object.freeze(n);
      }

      const Popper__namespace = /*#__PURE__*/_interopNamespace(Popper);
      const EventHandler__default = /*#__PURE__*/_interopDefaultLegacy(EventHandler);
      const Manipulator__default = /*#__PURE__*/_interopDefaultLegacy(Manipulator);
      const SelectorEngine__default = /*#__PURE__*/_interopDefaultLegacy(SelectorEngine);
      const BaseComponent__default = /*#__PURE__*/_interopDefaultLegacy(BaseComponent);

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): util/index.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */

      const toType = obj => {
        if (obj === null || obj === undefined) {
          return `${obj}`;
        }

        return {}.toString.call(obj).match(/\s([a-z]+)/i)[1].toLowerCase();
      };

      const getSelector = element => {
        let selector = element.getAttribute('data-bs-target');

        if (!selector || selector === '#') {
          let hrefAttr = element.getAttribute('href'); // The only valid content that could double as a selector are IDs or classes,
          // so everything starting with `#` or `.`. If a "real" URL is used as the selector,
          // `document.querySelector` will rightfully complain it is invalid.
          // See https://github.com/twbs/bootstrap/issues/32273

          if (!hrefAttr || !hrefAttr.includes('#') && !hrefAttr.startsWith('.')) {
            return null;
          } // Just in case some CMS puts out a full URL with the anchor appended


          if (hrefAttr.includes('#') && !hrefAttr.startsWith('#')) {
            hrefAttr = `#${hrefAttr.split('#')[1]}`;
          }

          selector = hrefAttr && hrefAttr !== '#' ? hrefAttr.trim() : null;
        }

        return selector;
      };

      const getElementFromSelector = element => {
        const selector = getSelector(element);
        return selector ? document.querySelector(selector) : null;
      };

      const isElement = obj => {
        if (!obj || typeof obj !== 'object') {
          return false;
        }

        if (typeof obj.jquery !== 'undefined') {
          obj = obj[0];
        }

        return typeof obj.nodeType !== 'undefined';
      };

      const getElement = obj => {
        if (isElement(obj)) {
          // it's a jQuery object or a node element
          return obj.jquery ? obj[0] : obj;
        }

        if (typeof obj === 'string' && obj.length > 0) {
          return document.querySelector(obj);
        }

        return null;
      };

      const typeCheckConfig = (componentName, config, configTypes) => {
        Object.keys(configTypes).forEach(property => {
          const expectedTypes = configTypes[property];
          const value = config[property];
          const valueType = value && isElement(value) ? 'element' : toType(value);

          if (!new RegExp(expectedTypes).test(valueType)) {
            throw new TypeError(`${componentName.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
          }
        });
      };

      const isVisible = element => {
        if (!isElement(element) || element.getClientRects().length === 0) {
          return false;
        }

        return getComputedStyle(element).getPropertyValue('visibility') === 'visible';
      };

      const isDisabled = element => {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
          return true;
        }

        if (element.classList.contains('disabled')) {
          return true;
        }

        if (typeof element.disabled !== 'undefined') {
          return element.disabled;
        }

        return element.hasAttribute('disabled') && element.getAttribute('disabled') !== 'false';
      };

      const noop = () => {};

      const getjQuery = () => {
        const {
          jQuery
        } = window;

        if (jQuery && !document.body.hasAttribute('data-bs-no-jquery')) {
          return jQuery;
        }

        return null;
      };

      const DOMContentLoadedCallbacks = [];

      const onDOMContentLoaded = callback => {
        if (document.readyState === 'loading') {
          // add listener on the first call when the document is in loading state
          if (!DOMContentLoadedCallbacks.length) {
            document.addEventListener('DOMContentLoaded', () => {
              DOMContentLoadedCallbacks.forEach(callback => callback());
            });
          }

          DOMContentLoadedCallbacks.push(callback);
        } else {
          callback();
        }
      };

      const isRTL = () => document.documentElement.dir === 'rtl';

      const defineJQueryPlugin = plugin => {
        onDOMContentLoaded(() => {
          const $ = getjQuery();
          /* istanbul ignore if */

          if ($) {
            const name = plugin.NAME;
            const JQUERY_NO_CONFLICT = $.fn[name];
            $.fn[name] = plugin.jQueryInterface;
            $.fn[name].Constructor = plugin;

            $.fn[name].noConflict = () => {
              $.fn[name] = JQUERY_NO_CONFLICT;
              return plugin.jQueryInterface;
            };
          }
        });
      };
      /**
       * Return the previous/next element of a list.
       *
       * @param {array} list    The list of elements
       * @param activeElement   The active element
       * @param shouldGetNext   Choose to get next or previous element
       * @param isCycleAllowed
       * @return {Element|elem} The proper element
       */


      const getNextActiveElement = (list, activeElement, shouldGetNext, isCycleAllowed) => {
        let index = list.indexOf(activeElement); // if the element does not exist in the list return an element depending on the direction and if cycle is allowed

        if (index === -1) {
          return list[!shouldGetNext && isCycleAllowed ? list.length - 1 : 0];
        }

        const listLength = list.length;
        index += shouldGetNext ? 1 : -1;

        if (isCycleAllowed) {
          index = (index + listLength) % listLength;
        }

        return list[Math.max(0, Math.min(index, listLength - 1))];
      };

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): dropdown.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */
      /**
       * ------------------------------------------------------------------------
       * Constants
       * ------------------------------------------------------------------------
       */

      const NAME = 'dropdown';
      const DATA_KEY = 'bs.dropdown';
      const EVENT_KEY = `.${DATA_KEY}`;
      const DATA_API_KEY = '.data-api';
      const ESCAPE_KEY = 'Escape';
      const SPACE_KEY = 'Space';
      const TAB_KEY = 'Tab';
      const ARROW_UP_KEY = 'ArrowUp';
      const ARROW_DOWN_KEY = 'ArrowDown';
      const RIGHT_MOUSE_BUTTON = 2; // MouseEvent.button value for the secondary button, usually the right button

      const REGEXP_KEYDOWN = new RegExp(`${ARROW_UP_KEY}|${ARROW_DOWN_KEY}|${ESCAPE_KEY}`);
      const EVENT_HIDE = `hide${EVENT_KEY}`;
      const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
      const EVENT_SHOW = `show${EVENT_KEY}`;
      const EVENT_SHOWN = `shown${EVENT_KEY}`;
      const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
      const EVENT_KEYDOWN_DATA_API = `keydown${EVENT_KEY}${DATA_API_KEY}`;
      const EVENT_KEYUP_DATA_API = `keyup${EVENT_KEY}${DATA_API_KEY}`;
      const CLASS_NAME_SHOW = 'show';
      const CLASS_NAME_DROPUP = 'dropup';
      const CLASS_NAME_DROPEND = 'dropend';
      const CLASS_NAME_DROPSTART = 'dropstart';
      const CLASS_NAME_NAVBAR = 'navbar';
      const SELECTOR_DATA_TOGGLE = '[data-bs-toggle="dropdown"]';
      const SELECTOR_MENU = '.dropdown-menu';
      const SELECTOR_NAVBAR_NAV = '.navbar-nav';
      const SELECTOR_VISIBLE_ITEMS = '.dropdown-menu .dropdown-item:not(.disabled):not(:disabled)';
      const PLACEMENT_TOP = isRTL() ? 'top-end' : 'top-start';
      const PLACEMENT_TOPEND = isRTL() ? 'top-start' : 'top-end';
      const PLACEMENT_BOTTOM = isRTL() ? 'bottom-end' : 'bottom-start';
      const PLACEMENT_BOTTOMEND = isRTL() ? 'bottom-start' : 'bottom-end';
      const PLACEMENT_RIGHT = isRTL() ? 'left-start' : 'right-start';
      const PLACEMENT_LEFT = isRTL() ? 'right-start' : 'left-start';
      const Default = {
        offset: [0, 2],
        boundary: 'clippingParents',
        reference: 'toggle',
        display: 'dynamic',
        popperConfig: null,
        autoClose: true
      };
      const DefaultType = {
        offset: '(array|string|function)',
        boundary: '(string|element)',
        reference: '(string|element|object)',
        display: 'string',
        popperConfig: '(null|object|function)',
        autoClose: '(boolean|string)'
      };
      /**
       * ------------------------------------------------------------------------
       * Class Definition
       * ------------------------------------------------------------------------
       */

      class Dropdown extends BaseComponent__default.default {
        constructor(element, config) {
          super(element);
          this._popper = null;
          this._config = this._getConfig(config);
          this._menu = this._getMenuElement();
          this._inNavbar = this._detectNavbar();
        } // Getters


        static get Default() {
          return Default;
        }

        static get DefaultType() {
          return DefaultType;
        }

        static get NAME() {
          return NAME;
        } // Public


        toggle() {
          return this._isShown() ? this.hide() : this.show();
        }

        show() {
          if (isDisabled(this._element) || this._isShown(this._menu)) {
            return;
          }

          const relatedTarget = {
            relatedTarget: this._element
          };
          const showEvent = EventHandler__default.default.trigger(this._element, EVENT_SHOW, relatedTarget);

          if (showEvent.defaultPrevented) {
            return;
          }

          const parent = Dropdown.getParentFromElement(this._element); // Totally disable Popper for Dropdowns in Navbar

          if (this._inNavbar) {
            Manipulator__default.default.setDataAttribute(this._menu, 'popper', 'none');
          } else {
            this._createPopper(parent);
          } // If this is a touch-enabled device we add extra
          // empty mouseover listeners to the body's immediate children;
          // only needed because of broken event delegation on iOS
          // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html


          if ('ontouchstart' in document.documentElement && !parent.closest(SELECTOR_NAVBAR_NAV)) {
            [].concat(...document.body.children).forEach(elem => EventHandler__default.default.on(elem, 'mouseover', noop));
          }

          this._element.focus();

          this._element.setAttribute('aria-expanded', true);

          this._menu.classList.add(CLASS_NAME_SHOW);

          this._element.classList.add(CLASS_NAME_SHOW);

          EventHandler__default.default.trigger(this._element, EVENT_SHOWN, relatedTarget);
        }

        hide() {
          if (isDisabled(this._element) || !this._isShown(this._menu)) {
            return;
          }

          const relatedTarget = {
            relatedTarget: this._element
          };

          this._completeHide(relatedTarget);
        }

        dispose() {
          if (this._popper) {
            this._popper.destroy();
          }

          super.dispose();
        }

        update() {
          this._inNavbar = this._detectNavbar();

          if (this._popper) {
            this._popper.update();
          }
        } // Private


        _completeHide(relatedTarget) {
          const hideEvent = EventHandler__default.default.trigger(this._element, EVENT_HIDE, relatedTarget);

          if (hideEvent.defaultPrevented) {
            return;
          } // If this is a touch-enabled device we remove the extra
          // empty mouseover listeners we added for iOS support


          if ('ontouchstart' in document.documentElement) {
            [].concat(...document.body.children).forEach(elem => EventHandler__default.default.off(elem, 'mouseover', noop));
          }

          if (this._popper) {
            this._popper.destroy();
          }

          this._menu.classList.remove(CLASS_NAME_SHOW);

          this._element.classList.remove(CLASS_NAME_SHOW);

          this._element.setAttribute('aria-expanded', 'false');

          Manipulator__default.default.removeDataAttribute(this._menu, 'popper');
          EventHandler__default.default.trigger(this._element, EVENT_HIDDEN, relatedTarget);
        }

        _getConfig(config) {
          config = { ...this.constructor.Default,
            ...Manipulator__default.default.getDataAttributes(this._element),
            ...config
          };
          typeCheckConfig(NAME, config, this.constructor.DefaultType);

          if (typeof config.reference === 'object' && !isElement(config.reference) && typeof config.reference.getBoundingClientRect !== 'function') {
            // Popper virtual elements require a getBoundingClientRect method
            throw new TypeError(`${NAME.toUpperCase()}: Option "reference" provided type "object" without a required "getBoundingClientRect" method.`);
          }

          return config;
        }

        _createPopper(parent) {
          if (typeof Popper__namespace === 'undefined') {
            throw new TypeError('Bootstrap\'s dropdowns require Popper (https://popper.js.org)');
          }

          let referenceElement = this._element;

          if (this._config.reference === 'parent') {
            referenceElement = parent;
          } else if (isElement(this._config.reference)) {
            referenceElement = getElement(this._config.reference);
          } else if (typeof this._config.reference === 'object') {
            referenceElement = this._config.reference;
          }

          const popperConfig = this._getPopperConfig();

          const isDisplayStatic = popperConfig.modifiers.find(modifier => modifier.name === 'applyStyles' && modifier.enabled === false);
          this._popper = Popper__namespace.createPopper(referenceElement, this._menu, popperConfig);

          if (isDisplayStatic) {
            Manipulator__default.default.setDataAttribute(this._menu, 'popper', 'static');
          }
        }

        _isShown(element = this._element) {
          return element.classList.contains(CLASS_NAME_SHOW);
        }

        _getMenuElement() {
          return SelectorEngine__default.default.next(this._element, SELECTOR_MENU)[0];
        }

        _getPlacement() {
          const parentDropdown = this._element.parentNode;

          if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
            return PLACEMENT_RIGHT;
          }

          if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
            return PLACEMENT_LEFT;
          } // We need to trim the value because custom properties can also include spaces


          const isEnd = getComputedStyle(this._menu).getPropertyValue('--bs-position').trim() === 'end';

          if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
            return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
          }

          return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
        }

        _detectNavbar() {
          return this._element.closest(`.${CLASS_NAME_NAVBAR}`) !== null;
        }

        _getOffset() {
          const {
            offset
          } = this._config;

          if (typeof offset === 'string') {
            return offset.split(',').map(val => Number.parseInt(val, 10));
          }

          if (typeof offset === 'function') {
            return popperData => offset(popperData, this._element);
          }

          return offset;
        }

        _getPopperConfig() {
          const defaultBsPopperConfig = {
            placement: this._getPlacement(),
            modifiers: [{
              name: 'preventOverflow',
              options: {
                boundary: this._config.boundary
              }
            }, {
              name: 'offset',
              options: {
                offset: this._getOffset()
              }
            }]
          }; // Disable Popper if we have a static display

          if (this._config.display === 'static') {
            defaultBsPopperConfig.modifiers = [{
              name: 'applyStyles',
              enabled: false
            }];
          }

          return { ...defaultBsPopperConfig,
            ...(typeof this._config.popperConfig === 'function' ? this._config.popperConfig(defaultBsPopperConfig) : this._config.popperConfig)
          };
        }

        _selectMenuItem({
          key,
          target
        }) {
          const items = SelectorEngine__default.default.find(SELECTOR_VISIBLE_ITEMS, this._menu).filter(isVisible);

          if (!items.length) {
            return;
          } // if target isn't included in items (e.g. when expanding the dropdown)
          // allow cycling to get the last item in case key equals ARROW_UP_KEY


          getNextActiveElement(items, target, key === ARROW_DOWN_KEY, !items.includes(target)).focus();
        } // Static


        static jQueryInterface(config) {
          return this.each(function () {
            const data = Dropdown.getOrCreateInstance(this, config);

            if (typeof config !== 'string') {
              return;
            }

            if (typeof data[config] === 'undefined') {
              throw new TypeError(`No method named "${config}"`);
            }

            data[config]();
          });
        }

        static clearMenus(event) {
          if (event && (event.button === RIGHT_MOUSE_BUTTON || event.type === 'keyup' && event.key !== TAB_KEY)) {
            return;
          }

          const toggles = SelectorEngine__default.default.find(SELECTOR_DATA_TOGGLE);

          for (let i = 0, len = toggles.length; i < len; i++) {
            const context = Dropdown.getInstance(toggles[i]);

            if (!context || context._config.autoClose === false) {
              continue;
            }

            if (!context._isShown()) {
              continue;
            }

            const relatedTarget = {
              relatedTarget: context._element
            };

            if (event) {
              const composedPath = event.composedPath();
              const isMenuTarget = composedPath.includes(context._menu);

              if (composedPath.includes(context._element) || context._config.autoClose === 'inside' && !isMenuTarget || context._config.autoClose === 'outside' && isMenuTarget) {
                continue;
              } // Tab navigation through the dropdown menu or events from contained inputs shouldn't close the menu


              if (context._menu.contains(event.target) && (event.type === 'keyup' && event.key === TAB_KEY || /input|select|option|textarea|form/i.test(event.target.tagName))) {
                continue;
              }

              if (event.type === 'click') {
                relatedTarget.clickEvent = event;
              }
            }

            context._completeHide(relatedTarget);
          }
        }

        static getParentFromElement(element) {
          return getElementFromSelector(element) || element.parentNode;
        }

        static dataApiKeydownHandler(event) {
          // If not input/textarea:
          //  - And not a key in REGEXP_KEYDOWN => not a dropdown command
          // If input/textarea:
          //  - If space key => not a dropdown command
          //  - If key is other than escape
          //    - If key is not up or down => not a dropdown command
          //    - If trigger inside the menu => not a dropdown command
          if (/input|textarea/i.test(event.target.tagName) ? event.key === SPACE_KEY || event.key !== ESCAPE_KEY && (event.key !== ARROW_DOWN_KEY && event.key !== ARROW_UP_KEY || event.target.closest(SELECTOR_MENU)) : !REGEXP_KEYDOWN.test(event.key)) {
            return;
          }

          const isActive = this.classList.contains(CLASS_NAME_SHOW);

          if (!isActive && event.key === ESCAPE_KEY) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          if (isDisabled(this)) {
            return;
          }

          const getToggleButton = this.matches(SELECTOR_DATA_TOGGLE) ? this : SelectorEngine__default.default.prev(this, SELECTOR_DATA_TOGGLE)[0];
          const instance = Dropdown.getOrCreateInstance(getToggleButton);

          if (event.key === ESCAPE_KEY) {
            instance.hide();
            return;
          }

          if (event.key === ARROW_UP_KEY || event.key === ARROW_DOWN_KEY) {
            if (!isActive) {
              instance.show();
            }

            instance._selectMenuItem(event);

            return;
          }

          if (!isActive || event.key === SPACE_KEY) {
            Dropdown.clearMenus();
          }
        }

      }
      /**
       * ------------------------------------------------------------------------
       * Data Api implementation
       * ------------------------------------------------------------------------
       */


      EventHandler__default.default.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_DATA_TOGGLE, Dropdown.dataApiKeydownHandler);
      EventHandler__default.default.on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
      EventHandler__default.default.on(document, EVENT_CLICK_DATA_API, Dropdown.clearMenus);
      EventHandler__default.default.on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
      EventHandler__default.default.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
        event.preventDefault();
        Dropdown.getOrCreateInstance(this).toggle();
      });
      /**
       * ------------------------------------------------------------------------
       * jQuery
       * ------------------------------------------------------------------------
       * add .Dropdown to jQuery only if jQuery is present
       */

      defineJQueryPlugin(Dropdown);

      return Dropdown;

    }));

    }(dropdown));

    var collapse = {exports: {}};

    /*!
      * Bootstrap collapse.js v5.1.3 (https://getbootstrap.com/)
      * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
      * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
      */

    (function (module, exports) {
    (function (global, factory) {
      module.exports = factory(data.exports, eventHandler.exports, manipulator.exports, selectorEngine.exports, baseComponent.exports) ;
    })(commonjsGlobal, (function (Data, EventHandler, Manipulator, SelectorEngine, BaseComponent) {
      const _interopDefaultLegacy = e => e && typeof e === 'object' && 'default' in e ? e : { default: e };

      const Data__default = /*#__PURE__*/_interopDefaultLegacy(Data);
      const EventHandler__default = /*#__PURE__*/_interopDefaultLegacy(EventHandler);
      const Manipulator__default = /*#__PURE__*/_interopDefaultLegacy(Manipulator);
      const SelectorEngine__default = /*#__PURE__*/_interopDefaultLegacy(SelectorEngine);
      const BaseComponent__default = /*#__PURE__*/_interopDefaultLegacy(BaseComponent);

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): util/index.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */

      const toType = obj => {
        if (obj === null || obj === undefined) {
          return `${obj}`;
        }

        return {}.toString.call(obj).match(/\s([a-z]+)/i)[1].toLowerCase();
      };

      const getSelector = element => {
        let selector = element.getAttribute('data-bs-target');

        if (!selector || selector === '#') {
          let hrefAttr = element.getAttribute('href'); // The only valid content that could double as a selector are IDs or classes,
          // so everything starting with `#` or `.`. If a "real" URL is used as the selector,
          // `document.querySelector` will rightfully complain it is invalid.
          // See https://github.com/twbs/bootstrap/issues/32273

          if (!hrefAttr || !hrefAttr.includes('#') && !hrefAttr.startsWith('.')) {
            return null;
          } // Just in case some CMS puts out a full URL with the anchor appended


          if (hrefAttr.includes('#') && !hrefAttr.startsWith('#')) {
            hrefAttr = `#${hrefAttr.split('#')[1]}`;
          }

          selector = hrefAttr && hrefAttr !== '#' ? hrefAttr.trim() : null;
        }

        return selector;
      };

      const getSelectorFromElement = element => {
        const selector = getSelector(element);

        if (selector) {
          return document.querySelector(selector) ? selector : null;
        }

        return null;
      };

      const getElementFromSelector = element => {
        const selector = getSelector(element);
        return selector ? document.querySelector(selector) : null;
      };

      const isElement = obj => {
        if (!obj || typeof obj !== 'object') {
          return false;
        }

        if (typeof obj.jquery !== 'undefined') {
          obj = obj[0];
        }

        return typeof obj.nodeType !== 'undefined';
      };

      const getElement = obj => {
        if (isElement(obj)) {
          // it's a jQuery object or a node element
          return obj.jquery ? obj[0] : obj;
        }

        if (typeof obj === 'string' && obj.length > 0) {
          return document.querySelector(obj);
        }

        return null;
      };

      const typeCheckConfig = (componentName, config, configTypes) => {
        Object.keys(configTypes).forEach(property => {
          const expectedTypes = configTypes[property];
          const value = config[property];
          const valueType = value && isElement(value) ? 'element' : toType(value);

          if (!new RegExp(expectedTypes).test(valueType)) {
            throw new TypeError(`${componentName.toUpperCase()}: Option "${property}" provided type "${valueType}" but expected type "${expectedTypes}".`);
          }
        });
      };
      /**
       * Trick to restart an element's animation
       *
       * @param {HTMLElement} element
       * @return void
       *
       * @see https://www.charistheo.io/blog/2021/02/restart-a-css-animation-with-javascript/#restarting-a-css-animation
       */


      const reflow = element => {
        // eslint-disable-next-line no-unused-expressions
        element.offsetHeight;
      };

      const getjQuery = () => {
        const {
          jQuery
        } = window;

        if (jQuery && !document.body.hasAttribute('data-bs-no-jquery')) {
          return jQuery;
        }

        return null;
      };

      const DOMContentLoadedCallbacks = [];

      const onDOMContentLoaded = callback => {
        if (document.readyState === 'loading') {
          // add listener on the first call when the document is in loading state
          if (!DOMContentLoadedCallbacks.length) {
            document.addEventListener('DOMContentLoaded', () => {
              DOMContentLoadedCallbacks.forEach(callback => callback());
            });
          }

          DOMContentLoadedCallbacks.push(callback);
        } else {
          callback();
        }
      };

      const defineJQueryPlugin = plugin => {
        onDOMContentLoaded(() => {
          const $ = getjQuery();
          /* istanbul ignore if */

          if ($) {
            const name = plugin.NAME;
            const JQUERY_NO_CONFLICT = $.fn[name];
            $.fn[name] = plugin.jQueryInterface;
            $.fn[name].Constructor = plugin;

            $.fn[name].noConflict = () => {
              $.fn[name] = JQUERY_NO_CONFLICT;
              return plugin.jQueryInterface;
            };
          }
        });
      };

      /**
       * --------------------------------------------------------------------------
       * Bootstrap (v5.1.3): collapse.js
       * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
       * --------------------------------------------------------------------------
       */
      /**
       * ------------------------------------------------------------------------
       * Constants
       * ------------------------------------------------------------------------
       */

      const NAME = 'collapse';
      const DATA_KEY = 'bs.collapse';
      const EVENT_KEY = `.${DATA_KEY}`;
      const DATA_API_KEY = '.data-api';
      const Default = {
        toggle: true,
        parent: null
      };
      const DefaultType = {
        toggle: 'boolean',
        parent: '(null|element)'
      };
      const EVENT_SHOW = `show${EVENT_KEY}`;
      const EVENT_SHOWN = `shown${EVENT_KEY}`;
      const EVENT_HIDE = `hide${EVENT_KEY}`;
      const EVENT_HIDDEN = `hidden${EVENT_KEY}`;
      const EVENT_CLICK_DATA_API = `click${EVENT_KEY}${DATA_API_KEY}`;
      const CLASS_NAME_SHOW = 'show';
      const CLASS_NAME_COLLAPSE = 'collapse';
      const CLASS_NAME_COLLAPSING = 'collapsing';
      const CLASS_NAME_COLLAPSED = 'collapsed';
      const CLASS_NAME_DEEPER_CHILDREN = `:scope .${CLASS_NAME_COLLAPSE} .${CLASS_NAME_COLLAPSE}`;
      const CLASS_NAME_HORIZONTAL = 'collapse-horizontal';
      const WIDTH = 'width';
      const HEIGHT = 'height';
      const SELECTOR_ACTIVES = '.collapse.show, .collapse.collapsing';
      const SELECTOR_DATA_TOGGLE = '[data-bs-toggle="collapse"]';
      /**
       * ------------------------------------------------------------------------
       * Class Definition
       * ------------------------------------------------------------------------
       */

      class Collapse extends BaseComponent__default.default {
        constructor(element, config) {
          super(element);
          this._isTransitioning = false;
          this._config = this._getConfig(config);
          this._triggerArray = [];
          const toggleList = SelectorEngine__default.default.find(SELECTOR_DATA_TOGGLE);

          for (let i = 0, len = toggleList.length; i < len; i++) {
            const elem = toggleList[i];
            const selector = getSelectorFromElement(elem);
            const filterElement = SelectorEngine__default.default.find(selector).filter(foundElem => foundElem === this._element);

            if (selector !== null && filterElement.length) {
              this._selector = selector;

              this._triggerArray.push(elem);
            }
          }

          this._initializeChildren();

          if (!this._config.parent) {
            this._addAriaAndCollapsedClass(this._triggerArray, this._isShown());
          }

          if (this._config.toggle) {
            this.toggle();
          }
        } // Getters


        static get Default() {
          return Default;
        }

        static get NAME() {
          return NAME;
        } // Public


        toggle() {
          if (this._isShown()) {
            this.hide();
          } else {
            this.show();
          }
        }

        show() {
          if (this._isTransitioning || this._isShown()) {
            return;
          }

          let actives = [];
          let activesData;

          if (this._config.parent) {
            const children = SelectorEngine__default.default.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
            actives = SelectorEngine__default.default.find(SELECTOR_ACTIVES, this._config.parent).filter(elem => !children.includes(elem)); // remove children if greater depth
          }

          const container = SelectorEngine__default.default.findOne(this._selector);

          if (actives.length) {
            const tempActiveData = actives.find(elem => container !== elem);
            activesData = tempActiveData ? Collapse.getInstance(tempActiveData) : null;

            if (activesData && activesData._isTransitioning) {
              return;
            }
          }

          const startEvent = EventHandler__default.default.trigger(this._element, EVENT_SHOW);

          if (startEvent.defaultPrevented) {
            return;
          }

          actives.forEach(elemActive => {
            if (container !== elemActive) {
              Collapse.getOrCreateInstance(elemActive, {
                toggle: false
              }).hide();
            }

            if (!activesData) {
              Data__default.default.set(elemActive, DATA_KEY, null);
            }
          });

          const dimension = this._getDimension();

          this._element.classList.remove(CLASS_NAME_COLLAPSE);

          this._element.classList.add(CLASS_NAME_COLLAPSING);

          this._element.style[dimension] = 0;

          this._addAriaAndCollapsedClass(this._triggerArray, true);

          this._isTransitioning = true;

          const complete = () => {
            this._isTransitioning = false;

            this._element.classList.remove(CLASS_NAME_COLLAPSING);

            this._element.classList.add(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW);

            this._element.style[dimension] = '';
            EventHandler__default.default.trigger(this._element, EVENT_SHOWN);
          };

          const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
          const scrollSize = `scroll${capitalizedDimension}`;

          this._queueCallback(complete, this._element, true);

          this._element.style[dimension] = `${this._element[scrollSize]}px`;
        }

        hide() {
          if (this._isTransitioning || !this._isShown()) {
            return;
          }

          const startEvent = EventHandler__default.default.trigger(this._element, EVENT_HIDE);

          if (startEvent.defaultPrevented) {
            return;
          }

          const dimension = this._getDimension();

          this._element.style[dimension] = `${this._element.getBoundingClientRect()[dimension]}px`;
          reflow(this._element);

          this._element.classList.add(CLASS_NAME_COLLAPSING);

          this._element.classList.remove(CLASS_NAME_COLLAPSE, CLASS_NAME_SHOW);

          const triggerArrayLength = this._triggerArray.length;

          for (let i = 0; i < triggerArrayLength; i++) {
            const trigger = this._triggerArray[i];
            const elem = getElementFromSelector(trigger);

            if (elem && !this._isShown(elem)) {
              this._addAriaAndCollapsedClass([trigger], false);
            }
          }

          this._isTransitioning = true;

          const complete = () => {
            this._isTransitioning = false;

            this._element.classList.remove(CLASS_NAME_COLLAPSING);

            this._element.classList.add(CLASS_NAME_COLLAPSE);

            EventHandler__default.default.trigger(this._element, EVENT_HIDDEN);
          };

          this._element.style[dimension] = '';

          this._queueCallback(complete, this._element, true);
        }

        _isShown(element = this._element) {
          return element.classList.contains(CLASS_NAME_SHOW);
        } // Private


        _getConfig(config) {
          config = { ...Default,
            ...Manipulator__default.default.getDataAttributes(this._element),
            ...config
          };
          config.toggle = Boolean(config.toggle); // Coerce string values

          config.parent = getElement(config.parent);
          typeCheckConfig(NAME, config, DefaultType);
          return config;
        }

        _getDimension() {
          return this._element.classList.contains(CLASS_NAME_HORIZONTAL) ? WIDTH : HEIGHT;
        }

        _initializeChildren() {
          if (!this._config.parent) {
            return;
          }

          const children = SelectorEngine__default.default.find(CLASS_NAME_DEEPER_CHILDREN, this._config.parent);
          SelectorEngine__default.default.find(SELECTOR_DATA_TOGGLE, this._config.parent).filter(elem => !children.includes(elem)).forEach(element => {
            const selected = getElementFromSelector(element);

            if (selected) {
              this._addAriaAndCollapsedClass([element], this._isShown(selected));
            }
          });
        }

        _addAriaAndCollapsedClass(triggerArray, isOpen) {
          if (!triggerArray.length) {
            return;
          }

          triggerArray.forEach(elem => {
            if (isOpen) {
              elem.classList.remove(CLASS_NAME_COLLAPSED);
            } else {
              elem.classList.add(CLASS_NAME_COLLAPSED);
            }

            elem.setAttribute('aria-expanded', isOpen);
          });
        } // Static


        static jQueryInterface(config) {
          return this.each(function () {
            const _config = {};

            if (typeof config === 'string' && /show|hide/.test(config)) {
              _config.toggle = false;
            }

            const data = Collapse.getOrCreateInstance(this, _config);

            if (typeof config === 'string') {
              if (typeof data[config] === 'undefined') {
                throw new TypeError(`No method named "${config}"`);
              }

              data[config]();
            }
          });
        }

      }
      /**
       * ------------------------------------------------------------------------
       * Data Api implementation
       * ------------------------------------------------------------------------
       */


      EventHandler__default.default.on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
        // preventDefault only for <a> elements (which change the URL) not inside the collapsible element
        if (event.target.tagName === 'A' || event.delegateTarget && event.delegateTarget.tagName === 'A') {
          event.preventDefault();
        }

        const selector = getSelectorFromElement(this);
        const selectorElements = SelectorEngine__default.default.find(selector);
        selectorElements.forEach(element => {
          Collapse.getOrCreateInstance(element, {
            toggle: false
          }).toggle();
        });
      });
      /**
       * ------------------------------------------------------------------------
       * jQuery
       * ------------------------------------------------------------------------
       * add .Collapse to jQuery only if jQuery is present
       */

      defineJQueryPlugin(Collapse);

      return Collapse;

    }));

    }(collapse));

    async function main (element) {
        const patch = init([attributesModule, eventListenersModule, classModule]);
        const ctrl = new Ctrl(redraw);
        let vnode = patch(element, loadingBody());
        function redraw() {
            vnode = patch(vnode, view(ctrl));
        }
        await ctrl.auth.init();
        routing(ctrl);
    }

    return main;

})();
