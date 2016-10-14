Shortly.createLinkView = Backbone.View.extend({
  className: 'creator',

  template: Templates.create,

  events: {
    'submit': 'shortenUrl'
  },

  render: function() {
    this.$el.html( this.template() );
    return this;
  },

  shortenUrl: function(e) {
    var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

    var isValidUrl = function(url) {
      return url.match(rValidUrl);
    };

    e.preventDefault();
    console.log(e);
    var $form = this.$el.find('form .text');

    var link = new Shortly.Link({ url: $form.val(), visits: 0 });
    console.log('*************', link);

    if (isValidUrl($form.val())) {
      this.success.call(this, link);
    } else {
      this.failure.call(this, {}, link);
    }

    // link.on('request', this.startSpinner, this);
    // link.on('sync', this.success, this);
    // link.on('error', this.failure, this);
    link.save({});
    $form.val('');
    

    
  },

  success: function(link) {
    console.log('SUCCESS!');
    this.stopSpinner();
    var view = new Shortly.LinkView({ model: link });
    this.$el.find('.message').append(view.render().$el.hide().fadeIn());
  },

  failure: function(model, res) {
    console.log('FAILURE.');
    this.stopSpinner();
    this.$el.find('.message')
      .html('Please URL')
      .addClass('error');
    return this;
  },

  startSpinner: function() {
    this.$el.find('img').show();
    this.$el.find('form input[type=submit]').attr('disabled', 'true');
    this.$el.find('.message')
      .html('')
      .removeClass('error');
  },

  stopSpinner: function() {
    this.$el.find('img').fadeOut('fast');
    this.$el.find('form input[type=submit]').attr('disabled', null);
    this.$el.find('.message')
      .html('')
      .removeClass('error');
  }
});
