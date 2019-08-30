import * as app from "tns-core-modules/application";
import { device, isAndroid, screen } from "tns-core-modules/platform";
import * as viewCommon from "tns-core-modules/ui/core/view/view-common";
import * as frame from "tns-core-modules/ui/frame";

const display = screen.mainScreen;
const whiteSpaceRegExp = /\s+/;

let started = false;

export class ClassList {
    constructor(className) {
        this.list = new Set();

        (className || "").split(whiteSpaceRegExp).forEach((v) => v && this.list.add(v));
    }

    add(...classes) {
        classes.forEach((v) => this.list.add(v));

        return this;
    }

    remove(...classes) {
        classes.forEach((v) => this.list.delete(v));

        return this;
    }

    get() {
        return Array.from(this.list).join(" ");
    }
}

export default class Theme {
    static setMode(mode = Theme.Light, root = app.getRootView()) {
        Theme.currentMode = mode;
        Theme.rootView = root;

        if (!root) {
            return;
        }

        const classList = new ClassList(Theme.rootView.className);

        classList
            .remove(Theme.Light, Theme.Dark)
            .add(Theme.currentMode);

        Theme.rootView.className = classList.get();
    }

    static getMode() {
        return Theme.currentMode;
    }
}

Theme.Light = "ns-light";
Theme.Dark = "ns-dark";
Theme.currentMode = Theme.Light;

// Where the magic happens
const oldSetupAsRootView = viewCommon.ViewCommon.prototype._setupAsRootView;
viewCommon.ViewCommon.prototype._setupAsRootView = function() {
    oldSetupAsRootView.call(this, ...arguments);
    Theme.setMode(Theme.currentMode);
};

function updateRootClasses(orientation, root = app.getRootView(), classes = []) {
    const classList = new ClassList(root.className);

    classList
        .remove("ns-portrait", "ns-landscape", "ns-unknown", ...classes)
        .add(`ns-${orientation}`, ...classes);

    root.className = classList.get();
}

function handleOrientation({ newValue: orientation }) {
    updateRootClasses(orientation);

    if (viewCommon._rootModalViews.length) {
        const classList = new ClassList(app.getRootView().className);

        viewCommon._rootModalViews.forEach((view) => updateRootClasses(orientation, view, classList.list.concat("ns-modal")));
    }
}

function getOrientation() {
    return display.heightDIPs > display.widthDIPs ? "portrait" : "landscape";
}

const rootModalTrap = {
    defineProperty(target, key, desc) {
        if (desc && "value" in desc) {
            target[key] = desc.value;

            if (desc.value instanceof frame.Frame) {
                const classList = new ClassList(app.getRootView().className);

                updateRootClasses(getOrientation(), desc.value, classList.list.concat("ns-modal"));
            }
        }

        return target;
    }
};

// Get notified when a modal is created.
viewCommon._rootModalViews = new Proxy(viewCommon._rootModalViews, rootModalTrap);

app.on(app.displayedEvent, () => {
    const root = app.getRootView();
    const classList = new ClassList(root.className);

    classList.add("ns-root", `ns-${isAndroid ? "android" : "ios"}`, `ns-${device.deviceType.toLowerCase()}`);

    root.className = classList.get();

    if (!started) {
        handleOrientation({ newValue: getOrientation() });
        app.on(app.orientationChangedEvent, handleOrientation);
        started = true;
    }
});