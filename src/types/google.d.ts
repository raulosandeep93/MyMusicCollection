declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken(overrideConfig?: { prompt?: string; hint?: string }): void;
    callback: (response: any) => void;
  }

  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback?: (response: any) => void;
    prompt?: string;
    error_callback?: (error: any) => void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
  function revoke(token: string, done: () => void): void;
}

declare namespace google.accounts.id {
  function revoke(hint: string, callback: (resp: any) => void): void;
}

declare namespace gapi {
  function load(apiOrApis: string, callbackOrConfig: any): void;
  namespace client {
    function init(args: any): Promise<any>;
    function request(args: any): Promise<any>;
    const drive: any;
  }
}

declare namespace google.picker {
  enum Action {
    PICKED = 'picked',
    CANCEL = 'cancel',
  }
  enum ViewId {
    FOLDERS = 'folders',
    DOCS = 'all',
  }
  class PickerBuilder {
    addView(view: any): PickerBuilder;
    setOAuthToken(token: string): PickerBuilder;
    setDeveloperKey(key: string): PickerBuilder;
    setOrigin(origin: string): PickerBuilder;
    setCallback(callback: (data: any) => void): PickerBuilder;
    setTitle(title: string): PickerBuilder;
    build(): Picker;
  }
  class DocsView {
    constructor(viewId?: string);
    setIncludeFolders(include: boolean): DocsView;
    setSelectFolderEnabled(enabled: boolean): DocsView;
    setMimeTypes(mimeTypes: string): DocsView;
  }
  interface Picker {
    setVisible(visible: boolean): void;
  }
}

interface Window {
  google?: {
    accounts?: {
      oauth2?: typeof google.accounts.oauth2;
      id?: typeof google.accounts.id;
    };
    picker?: typeof google.picker;
  };
  gapi?: typeof gapi;
}

