import {Observable} from 'data/observable';
import {topmost} from 'ui/frame';
import {knownFolders} from 'file-system';
import {isIOS, isAndroid} from 'platform';
var themes = require('nativescript-themes');

export class ThemesModel extends Observable {
  public labelText: string;
  private _toggled: boolean = false;

  constructor() {
    super();
    this.set('labelText', 'Default');
  }

  public applyDefault() {
    this.set('labelText', 'Default');
    themes.applyTheme(this.getPath('app'));
  }

  public applyLight() {
    this.set('labelText', 'Light');
    themes.applyTheme(this.getPath('light'));
  }

  public applyDark() {
    this.set('labelText', 'Dark');
    themes.applyTheme(this.getPath('dark'));
  }

  private getPath(name: string) {
    let appPath = knownFolders.currentApp().path + '/';
    let platform = '';
    return `${appPath}${name}${platform}.css`;
  }
}