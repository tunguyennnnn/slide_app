
    function autocomplete(options){
        if (!document.querySelector) return;

        // helpers
        function hasClass(el, className){ return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className); }

        function addEvent(el, type, handler){
            if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
        }
        function removeEvent(el, type, handler){
            // if (el.removeEventListener) not working in IE11
            if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
        }
        function live(elClass, event, cb, context){
            addEvent(context || document, event, function(e){
                var found, el = e.target || e.srcElement;
                while (el && !(found = hasClass(el, elClass))) el = el.parentElement;
                if (found) cb.call(el, e);
            });
        }


        var o = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            cache: 1,
            menuClass: '',
            renderItem: function (item, search){
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
            },
            onSelect: function(e, term, item){}
        };
        for (var k in options) { if (options.hasOwnProperty(k)) o[k] = options[k]; }


        //// create suggestions container "sc"
        this.sc = document.createElement('div');

        o.selector.appendChild(this.sc)
        this.sc.className = 'autocomplete-suggestions';
        this.cache = {};
        this.last_val = '';

        var self = this;
        this.showAuto = function(text, position, suggestedWords){
          self.sc.style.left = position.left + 'px';
          self.sc.style.top = position.top + 'px'
          self.sc.style.display = 'block';
          self.sc.innerHTML = suggest(text, suggestedWords);
        }
        this.hideAuto = function(){
          self.sc.innerHTML = '';
          self.sc.style.display = 'none';
        }

        function suggest(text, suggestedWords){
          text = text.toLowerCase();
          if (suggestedWords){
            return suggestedWords.map(function(match){
              return o.renderItem(match, match);
            }).join('');
          }else{
            var choices = hljs.listLanguages();
            var matches = [];
            for (i=0; i<choices.length; i++)
                if (~choices[i].toLowerCase().indexOf(text)) matches.push(choices[i]);
            return matches.map(function(match){
              return o.renderItem(match, text);
            }).join('');
          }
        }

        live('autocomplete-suggestion', 'mouseleave', function(e){
            var sel = self.sc.querySelector('.autocomplete-suggestion.selected');
            if (sel) setTimeout(function(){ sel.className = sel.className.replace('selected', ''); }, 20);
        }, self.sc);

        live('autocomplete-suggestion', 'mouseover', function(e){
            var sel = self.sc.querySelector('.autocomplete-suggestion.selected');
            if (sel) sel.className = sel.className.replace('selected', '');
            this.className += ' selected';
        }, self.sc);

        live('autocomplete-suggestion', 'mousedown', function(e){
            if (hasClass(this, 'autocomplete-suggestion')) { // else outside click
                var v = this.getAttribute('data-val');
                console.log(v);
                self.sc.style.display = 'none';
            }
        }, self.sc);


        this.keyPress = function(key){
            if ((key == 40 || key == 38) && self.sc.innerHTML) {
                var next, sel = self.sc.querySelector('.autocomplete-suggestion.selected');
                if (!sel) {
                    next = (key == 40) ? self.sc.querySelector('.autocomplete-suggestion') : self.sc.childNodes[self.sc.childNodes.length - 1]; // first : last
                    next.className += ' selected';
                    return next.getAttribute('data-val');
                } else {
                    next = (key == 40) ? sel.nextSibling : sel.previousSibling;
                    if (next) {
                        sel.className = sel.className.replace('selected', '');
                        next.className += ' selected';
                        return next.getAttribute('data-val');
                    }
                }
                return false;
            }
            // esc
            else if (key == 27) {
              self.sc.style.display = 'none';
            }
            // enter
            else if (key == 13 || key == 9) {
                var sel = self.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel && self.sc.style.display != 'none') {
                  console.log(sel.getAttribute('data-val'));
                }
            }
        };

    }
