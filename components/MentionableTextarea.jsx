KEY_CODE = {
  DOWN: 40,
  UP: 38,
  ESC: 27,
  TAB: 9,
  ENTER: 13,
  CTRL: 17,
  A: 65,
  P: 80,
  N: 78,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  BACKSPACE: 8,
  SPACE: 32
};

var MentionableTextarea = React.createClass({displayName: 'MentionableTextarea',
    getInitialState: function () {
        return {left: '0px', top: '0px', display: 'none', data: [], selectedOpt: 0,
             cursorPos: 0, flag: '', search_field: '', insert_field: '', query: {}};
    },
    matcher: function(flag, subtext, should_startWithSpace, acceptSpaceBar) {
      var _a, _y, match, regexp, space;
      flag = flag.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      if (should_startWithSpace) {
        flag = '(?:^|\\s)' + flag;
      }
      _a = decodeURI("%C3%80");
      _y = decodeURI("%C3%BF");
      space = acceptSpaceBar ? "\ " : "";
      regexp = new RegExp(flag + "([A-Za-z" + _a + "-" + _y + "0-9_" + space + "\'\.\+\-]*)$|" + flag + "([^\\x00-\\xff]*)$", 'gi');
      match = regexp.exec(subtext);
      if (match) {
        return match[2] || match[1];
      } else {
        return null;
      }
    },

    filter: function(query, data, searchKey) {
      var _results, i, item, len;
      _results = [];
      for (i = 0, len = data.length; i < len; i++) {
        item = data[i];
        if (~new String(item[searchKey]).toLowerCase().indexOf(query.toLowerCase())) {
          _results.push(item);
        }
      }
      return _results;
    },

    arrayToDefaultHash: function(data) {
      var i, item, len, results;
      if (!$.isArray(data)) {
        return data;
      }
      results = [];
      for (i = 0, len = data.length; i < len; i++) {
        item = data[i];
        if ($.isPlainObject(item)) {
          results.push(item);
        } else {
          results.push({
            name: item
          });
        }
      }
      return results;
    },

    hideOptBox: function () {
        this.setState({display: 'none'});
    },

    showOptBox: function () {
        if(!this.isOptBoxVisible()){
            console.log('here');
            this.resetOptSelected();
        }
        this.setState({display: 'block'});
    },

    resetOptSelected: function () {
        this.setState({selectedOpt: 0});
    },

    filterKeyCode: function (keyCode) {
        for (var key in KEY_CODE) {
            if (KEY_CODE.hasOwnProperty(key)) {
                if(keyCode === KEY_CODE[key]){
                    return true;
                }
            }
        }
        return false;
    },

    filterKey: function (event) {
        switch (event.keyCode) {
            case KEY_CODE.ESC:
                if(!this.isOptBoxVisible()){ // because we hide option box in handleKeyDown,
                                             // we don't want handleMention to show option box again
                    event.preventDefault();
                    return true;
                }
                break;
            case KEY_CODE.DOWN:
            case KEY_CODE.UP:
                return true;
        }
        return false;
    },

    isKeyboardEvent: function (event) {
        return event.hasOwnProperty('keyCode');
    },

    isOptBoxVisible: function () {
        return this.state.display === 'block';
    },

    handleMention: function (event) {
        if(this.filterKey(event)) return;

        if (this.isOptBoxVisible() && this.isKeyboardEvent(event)) {
            this.resetOptSelected();
        }

        var inputorNode = $(React.findDOMNode(this.refs.inputor));
        var offset = inputorNode.caret('offset');
        var pos = inputorNode.caret('pos');
        var newState = this.state;
        delete offset.height;
        this.setState(offset);
        this.setState({cursorPos: pos});

        var confs = [{flag: '@', search_field: 'name', insert_field: 'name'}, {flag: '#', search_field: 'title', insert_field: 'id'}];

        for(var i=0 ; i<confs.length ; i++){
            var data = [];
            var conf = confs[i];
            switch (conf.flag) {
                case '@':
                    data = [{id: 1, name: 'Tom', insert_field: 'name'}, {id: 2, name: 'Peter', insert_field: 'name'}, {id: 3, name: 'Cherry', insert_field: 'name'}];
                    break;
                case '#':
                    data = [{id: 1, title: 'Issue 1', insert_field: 'id'}, {id: 2, title: 'Issue 2', insert_field: 'id'}, {id: 3, title: 'Issue 3', insert_field: 'id'}];
                    break;
                default:
                    break;
            }

            data = this.arrayToDefaultHash(data);
            var source = inputorNode.val();
            startStr = source.slice(0, pos);
            query = this.matcher(conf.flag, startStr, true);
            if (typeof query === "string") {
                var start = pos - query.length;
                var end = start + query.length;
                query = {'text': query, 'headPos': start, 'endPos': end};
                this.setState({query: query});
                var result = this.filter(query.text, data, conf.search_field);
                if(result.length > 0){
                    this.setState({flag: conf.flag});
                    this.setState({search_field: conf.search_field});
                    this.setState({insert_field: conf.insert_field});
                    this.setState({data: result});
                    this.showOptBox();
                    break;
                } else {
                    this.hideOptBox();
                }
            } else {
                this.hideOptBox();
            }
        }
    },

    handleKeyDown: function (event) {
        if(!this.isOptBoxVisible()){
            return;
        }
        switch (event.keyCode) {
            case KEY_CODE.DOWN:
                event.preventDefault();
                var newSelected = (this.state.selectedOpt+1) % this.state.data.length;
                this.setState({selectedOpt: newSelected});
                break;
            case KEY_CODE.UP:
                event.preventDefault();
                var newSelected = (this.state.selectedOpt+this.state.data.length-1) % this.state.data.length;
                this.setState({selectedOpt: newSelected});
                break;
            case KEY_CODE.ENTER:
                event.preventDefault();
                this.hideOptBox();
                this.onChoose()
                break;
            case KEY_CODE.ESC:
                this.hideOptBox();
                break;
            default:
                console.log('non handled keydown');
        }
    },

    onChoose: function () {
        var chooseContent = this.state.data[this.state.selectedOpt][this.state.insert_field];
        this.insertAtCursor(this.state.flag + chooseContent);
    },

    insertAtCursor: function (content) {
        var inputor = $(React.findDOMNode(this.refs.inputor));
        var source = inputor.val();
        var pos = this.state.cursorPos;

        startStr = source.slice(0, Math.max(this.state.query.headPos - this.state.flag.length, 0));
        var suffix = " ";
        content += suffix;
        var text = startStr + content + source.slice(query.endPos || 0);

        inputor.val(text);
        inputor.caret('pos', startStr.length + content.length);
        React.findDOMNode(this.refs.inputor).focus();

        var event = new Event('input', { bubbles: true });
        React.findDOMNode(this.refs.inputor).dispatchEvent(event);
    },

    render: function () {
        return (
            <div className="mentionableTextarea">
                <textarea style={{width: '500px', height: '500px'}}
                    onKeyUp={this.handleMention}
                    onClick={this.handleMention}
                    onFocus={this.handleMention}
                    onKeyDown={this.handleKeyDown}
                    ref="inputor">

                </textarea>
                <OptionsBox conf={this.state} query={this.state.query.text} search_field={this.state.search_field} />
            </div>
        );
    }
});
