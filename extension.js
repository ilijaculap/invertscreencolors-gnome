// Based on and thanks to:
// https://github.com/linuxmint/cinnamon-spices-applets/tree/master/color-blind-filters%40rcalixte
// https://github.com/linuxmint/cinnamon-spices-extensions/tree/master/rnbdsh%40negateWindow
// https://extensions.gnome.org/extension/1041/invert-window-color/

// Invert screen/window colors

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

var SHORTCUT_FS = 'invert-fs-shortcut';
var SHORTCUT_WD = 'invert-wd-shortcut';

export const InversionEffect = GObject.registerClass(
class InversionEffect extends Clutter.ShaderEffect {
	vfunc_get_static_shader_source() {
		return ' \
			uniform sampler2D tex; \
			void main() { \
				vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
				if(color.a > 0.0) { \
					color.rgb /= color.a; \
				} \
				color.rgb = vec3(1.0, 1.0, 1.0) - color.rgb; \
				color.rgb *= color.a; \
				cogl_color_out = color * cogl_color_in; \
			} \
		';
	}

	vfunc_paint_target(...args) {
		this.set_uniform_value("tex", 0);
		super.vfunc_paint_target(...args);
	}
});

export default class InvertWindow extends Extension {

	clean_effect() {

		// Remove full screen filter
		if(Main.uiGroup.get_effect('invert-screen-color')) {
			Main.uiGroup.remove_effect_by_name('invert-screen-color');
		}

		// Remove all windows filter
		global.get_window_actors().forEach(function(actor) {
			if(actor.get_effect('invert-window-color')) {
				actor.remove_effect_by_name('invert-window-color');
			}
		}, this);
	}

	toggle_effect(area) {

		// For fullscreen
		if(area == "fs") {
			if(Main.uiGroup.get_effect('invert-screen-color')) {
			    Main.uiGroup.remove_effect_by_name('invert-screen-color');
		    }
		    else {
			    let effect_fs = new InversionEffect();
			    Main.uiGroup.add_effect_with_name('invert-screen-color', effect_fs);
			}
		}

		// For active window
		else if(area == "wd") {
			global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.has_focus()) {
				if(actor.get_effect('invert-window-color')) {
					actor.remove_effect_by_name('invert-window-color');
				}
				else {
					let effect_wd = new InversionEffect();
					actor.add_effect_with_name('invert-window-color', effect_wd);
				}
			}}, this);
		}
	}

	enable() {

		// Get settings
		this._settings = this.getSettings();

		// Clean effect 
		this.clean_effect();

		// Keyboard binding for full screen
		Main.wm.addKeybinding(
			SHORTCUT_FS,
			this._settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			() => { this.toggle_effect("fs"); }
		);
		
		// Keyboard binding for active window
		Main.wm.addKeybinding(
			SHORTCUT_WD,
			this._settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			() => { this.toggle_effect("wd"); }
		);
	}

	disable() {

		// Remove keybindings
		Main.wm.removeKeybinding(SHORTCUT_FS);
		Main.wm.removeKeybinding(SHORTCUT_WD);

		// Disable effect on everything
		this.clean_effect();

		// Remove settings
		this._settings = null;

	}
};
