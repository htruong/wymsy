// *************************************************************************
// ** WYMSY - The What You See is What You Mean editor
// (C) 2012 - 2013 Huan Truong - All rights reserved.
// *************************************************************************
/*
(function ($) {
    $.fn.autogrow = function () {
        this.filter('textarea').each(function () {
            var $this = $(this),
                minHeight = $this.height(),
                shadow = $('<div></div>').css({
                    position:   'absolute',
                    top: -10000,
                    left: -10000,
                    width: $(this).width(),
                    fontSize: $this.css('fontSize'),
                    fontFamily: $this.css('fontFamily'),
                    lineHeight: $this.css('lineHeight'),
                    resize: 'none'
                }).addClass('shadow').appendTo(document.body),
                update = function () {
                    var t = this;
                    setTimeout(function () {
                        var val = t.value.replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/&/g, '&amp;')
                                .replace(/\n/g, '<br/>&nbsp;');

                        if ($.trim(val) === '') {
                            val = 'a';
                        }

                        shadow.html(val);
                        $(t).css('height', Math.max(shadow[0].offsetHeight + 20, minHeight));
                    }, 0);
                };
		console.log($(this).width());

            $this.change(update).keyup(update).keydown(update).focus(update);
            update.apply(this);
        });

        return this;
    };

}(jQuery));
*/

function resizeTextarea() {
    this.style.height = "";

    var
        $this = $(this),
        outerHeight = $this.outerHeight(),
        scrollHeight = this.scrollHeight,
        innerHeight = $this.innerHeight(),
        magic = outerHeight - innerHeight;
    this.style.height = scrollHeight + magic + "px";
    return true;
};

WYMSY = function(options) {
    this.options = options;
    this.initialize();
};

WYMSY.prototype.initialize = function() {
    var sourceTxt = this.options.source;
	
	this.sourceStack = new WYMSYstack(null);
	
    var destHTML = marked( sourceTxt, { sourceStack: this.sourceStack } );

    this.options.editorarea.html(destHTML);
    
	this.makeClickEditable(this.options.editorarea.children());

	// need to ensure the last one is editable.
	var lastEditableElement = $('<div rel="lastEditable" class="last-editable"></div>');
	this.makeClickEditable(lastEditableElement);
	this.options.editorarea.append(lastEditableElement);
    
    this.options.editorarea.addClass('wymsy-editor');

    this.populateDestination();
    
    parent = this;
}

WYMSY.prototype.makeClickEditable = function(obj) {
    parent = this;

    obj.click(function() {
        parent.createInlineEditor( this );
    });
}

WYMSY.prototype.createInlineEditor = function(obj) {
    // Need to resolve the active editor
    if (this.activeEditor)
		this.handleParagraphEditDone(this.activeEditor);
    
    var originalCode = '';
    var isLastElement = false;
    
    if (typeof $(obj).attr == 'function' &&
	typeof $(obj).attr('rel') != 'undefined') {
	    if ($(obj).attr('rel') == 'lastEditable')
		isLastElement = true;
	    originalCode = this.sourceStack.take($(obj).attr('rel'));
	    originalCode = originalCode.replace(/[\r\n]+$/, '');
	    originalCode = originalCode.replace(/^[\r\n]+/, '');
    }
    
    parent = this;
    
    var inlineEd = $(
	'<textarea></textarea>',
	{
	    keydown: function(event) {
		return parent.handleKey(this, event.keyCode);
	    },
	}
    );
	inlineEd.val(originalCode);


    //$(inlineEd).autogrow();
     $(inlineEd)
 	.keydown(resizeTextarea);
 
     $(inlineEd)
 	.keyup(resizeTextarea);

    $(inlineEd)
	.change(resizeTextarea);
	
    $(inlineEd)
	.focus(resizeTextarea);
    
    if (!isLastElement) {
		$(obj).after(inlineEd);
		$(obj).remove();
    } else {
		$(obj).before(inlineEd);
    }

    $(inlineEd).focus();

    this.activeEditor = inlineEd;
}

WYMSY.prototype.handleParagraphEditDone = function(obj) {
    var replacementEl = $( marked($(obj).val(), {sourceStack: this.sourceStack}) );
    this.makeClickEditable(replacementEl);
    $(obj).before(replacementEl);
    $(obj).remove();

    this.activeEditor = null;
    if (typeof this.options.destination != 'null')
	this.populateDestination();
}

WYMSY.prototype.handleKey = function(obj, keyCode) {
    //console.log (keyCode);
    if (keyCode == 13) { // key enter
	var str = obj.value;
	if ((str.charAt(str.length-1) == '\n') /*&&
	    (str.charAt(str.length-2) == '\n')*/) {
	    var nextParagraph = $('<div></div>');
	    this.makeClickEditable(nextParagraph);
	    $(obj).after(nextParagraph);
	    this.createInlineEditor($(nextParagraph));

	    return false;
	}
    } else if (keyCode == 27) { // key esc
	this.handleParagraphEditDone(obj);
	return false;
    } else if (keyCode == 38) { // key up
	if (obj.selectionStart == 0) {
	    //console.log('up');
	    this.createInlineEditor($(obj).prev());
	    return false;
	}
    } else if (keyCode == 40) { // key down
	if (obj.selectionStart == obj.value.length) {
	    //console.log('down');
	    this.createInlineEditor($(obj).next());
	    return false;
	}

    } else if (keyCode == 46) { // key del
	if (obj.selectionStart == obj.value.length) {
	    //console.log('down');
	    var oldCursorPos = obj.value.length;
	    var nextParagraph = $(obj).next();

	    if ($(nextParagraph).attr('rel') != 'lastEditable') {
		var nextPCode = this.sourceStack.take($(nextParagraph).attr('rel'));

		obj.value += " " + nextPCode;
	    
		this.setSelectionRange(obj, oldCursorPos, oldCursorPos);
	    
		$(nextParagraph).remove();
	    }
	    
	    return false;
	}
    } else if (keyCode == 8) { // key bkspace
	if (
	    (obj.selectionStart == obj.selectionEnd) &&
	    (obj.selectionStart == 0)
	) {
	    //console.log('bkspace');
	    var oldCursorPos = obj.value.length;
	    var prevParagraph = $(obj).prev();
	    var prevPCode = this.sourceStack.take($(prevParagraph).attr('rel'));

	    obj.value = prevPCode + " " + obj.value;

	    this.setSelectionRange(obj, prevPCode.length, prevPCode.length);

	    $(prevParagraph).remove();

	    return false;
	}
    } else {
	//console.log(keyCode);
	return true;
    }
    //else
	//console.log (str.charAt(str.length-1) + str.charAt(str.length-2));
}

WYMSY.prototype.generateCode = function() {
    
    // Need to resolve the active editor
    if (this.activeEditor)
	this.handleParagraphEditDone(this.activeEditor);

    ret = '';

    parent =this;
    
    this.options.editorarea.children().map(function() {
	if (typeof $(this).attr('rel') == 'undefined') return;
		ret += parent.sourceStack.get($(this).attr('rel')) + '\n\n';
    });

    return ret;
}

WYMSY.prototype.populateDestination = function() {
    this.options.destination.val(this.generateCode());
}

WYMSY.prototype.setSelectionRange = function(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  }
  else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}
