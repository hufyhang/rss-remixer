$(function() {
    window.login = new Login($('#username-input'), $('#password-input'));
    window.user = undefined;
    window.feedParser = undefined;
    setNewsDivTop();
    registerEvents();
});

function setNewsDivTop() {
    var topHeight = $('.fixed-top').height();
    var margin = 10;
    var top = topHeight + margin;
    $('#news-div').css('top', top.toString() + "px");
}

function registerEvents() {
    $('#username-input').focus();

    $('#password-input').keydown(function(evt) {
        // if pressed enter
        if(evt.keyCode === 13) {
            $('#login-btn').click();
        }
    });

    $('#login-btn').on('click', function() {
        window.login.login();
    });

    $('#signup-btn').on('click', function(){
        window.login.signup();
    });

    $('#add-feed-btn').on('click', function() {
        window.user.addFeed($('#feed-input').val());
    });

    $('#feeds-btn').on('click', function() {
        if($(this).html() === 'Feeds') {
            $(this).html('News');
            window.user.showFeeds();
        }
        else {
            $(this).html('Feeds');
            window.user.fetchFeeds();
        }
    });
}

function Login(usernameDom, passwordDom) {
    this.usernameDom = usernameDom;
    this.passwordDom = passwordDom;

}

Login.prototype.login = function () {
    var username = this.usernameDom.val();
    var password = this.passwordDom.val();
    $('#username-text').html('#' + username);

    if(username.length === 0) {
        this.usernameDom.val('Invalid username');
        return;
    }

    password = hex_md5(password);

    var that = this;

    $.get('php/login.php',
            {username: username, password: password}
          ).done(function(data) {
              if(data === 'OK\n') {
                  username = hex_md5(username);
                  window.user = new User(username);
                  window.user.fetchFeeds();
                  $('.login-div').css('visibility', 'hidden').html('');
                  $('.dashboard').css('visibility', 'visible');
              }
              else if(data === 'ERROR\n') {
                  var msg = 'Invalid username or password';
                  that.usernameDom.val(msg);
                  that.passwordDom.val(msg);
              }
              else {
                  alert(data);
              }
          });
};

Login.prototype.signup = function() {
    var username = this.usernameDom.val();
    var password = this.passwordDom.val();

    if(username.length === 0) {
        this.usernameDom.val('Invalid username');
        return;
    }

    password = hex_md5(password);
    var that = this;

    $.post('php/create.php',
            {
                username: username,
                password: password
            }).done(function(data) {
                if(data === 'OK\n') {
                    that.login();
                }
                else {
                    $('#username-input').val(data);
                }
            });
};

function User(username) {
    this.username = username;
    this.feeds = [];
}

User.prototype.removeFeed = function(index, rss) {
    var that = this;
    $.post('php/delete.php', 
            {
                username: that.username,
                rss: rss
            }).done(function(data) {
                if(data === 'OK\n') {
                    $('#feed-row-' + index.toString()).html('');
                    // $('#feed-panel-' + index.toString()).removeClass().addClass('panel panel-default');
                    // $('#feed-panel-' + index.toString() + '>.label').css('visibility', 'hidden');
                }
                else {
                    console.log('Error: Cannot remove feed: ' + rss + '\nError information:\n' + data);
                }
            });
}

User.prototype.fetchFeeds = function() {
    var that = this;
    $.get('php/fetchFeeds.php',
            {
                username: that.username
            }).done(function(data) {
                window.feedParser = new FeedParser(data);
                if(window.feedParser.checkStatus()) {
                    window.feedParser.retrieveAll($('#news-div'));
                }
            });
};

User.prototype.fetchFeedByUrl = function(url) {
    $.get('php/readXml.php',
            {
                url: url
            }).done(function(data) {
                // !!!do not create new FeedParser instance!!!
                $('#news-div').html('');
                window.feedParser.parseXmlData(data);
                $('#feeds-btn').html('Feeds');
            });
};

User.prototype.showFeeds = function() {
    var that = this;
    $.get('php/fetchFeeds.php',
            {
                username: that.username
            }).done(function(data) {
                window.feedParser = new FeedParser(data);
                if(window.feedParser.checkStatus()) {
                    window.feedParser.retrieveFeeds($('#news-div'));
                }
            });
};

User.prototype.addFeed = function(url) {
    var that = this;
    $.post('php/add.php', 
            {
                username: that.username,
                url: url
            }).done(function(data) {
                if(data === 'OK\n') {
                    if($('#feeds-btn').html() === 'Feeds') {
                        window.user.fetchFeeds();
                    }
                    else {
                        window.user.showFeeds();
                    }
                }
                else  {
                    console.log('Error: Cannot add feed: ' + url + '\nError Information:\n' + data);
                }
            });
};

function FeedParser(json) {
    this.jsonObj = json;
    this.newsDom = undefined;
}

FeedParser.prototype.checkStatus = function() {
    return this.jsonObj.status === 'OK' ? true : false;
};

FeedParser.prototype.retrieveAll = function(newsDom) {
    this.newsDom = newsDom;
    this.newsDom.html('');

    var feeds = this.jsonObj['feeds'];
    NProgress.start();
    for(var index = 0; index != feeds.length; ++index) {
        var rss = feeds[index].rss;
        this.doRetrieveAll(rss, index, feeds.length);
        index + 1/feeds.length === 1 ? NProgress.done() : NProgress.set(index + 1/feeds.length);
    }
};

FeedParser.prototype.doRetrieveAll = function(rss, index, length) {
    var that = this;
    $.get('php/readXml.php', {
        url: rss
    }).done(function(data) {
        that.parseXmlData(data);
    });
};

FeedParser.prototype.retrieveFeeds = function(newsDom) {
    this.newsDom = newsDom;
    this.newsDom.html('');

    var feeds = this.jsonObj['feeds'];
    NProgress.start();
    for(var index = 0; index != feeds.length; ++index) {
        var rss = feeds[index].rss;
        this.doParseFeed(rss, index, feeds.length);
        index + 1/feeds.length === 1 ? NProgress.done() : NProgress.set(index + 1/feeds.length);
    }
};

FeedParser.prototype.doParseFeed = function(rss, index, length) {
    var that = this;
    $.get('php/readXml.php', {
        url: rss
    }).done(function(data) {
        that.parseFeed(data, rss, index);
    });
};

FeedParser.prototype.parseXmlData = function(xmlString) {
    var that = this;
    var xml = $.parseXML(xmlString),
        $xml = $(xml);
    $xml.find('rss').find('channel').find('item').each(function() {
        var buffer = '<div class="row"><a href="' + $(this).find('link').text() + '" target="_blank"><div class="panel panel-default"><div class="panel-heading">';
        buffer += '<b>' + $(this).find('title').text() + '</b></div>';
        buffer += '<div class="panel-body">Published: ' + $(this).find('pubDate').text() + '<br/><br/>' + $(this).find('description').text() + '</div>';
        buffer += '</div></div></a></div>';
        that.newsDom.html(that.newsDom.html() + buffer);
    });
};

FeedParser.prototype.parseFeed = function(xmlString, feedUrl, index) {
    var that = this;
    var xml = $.parseXML(xmlString),
        $xml = $(xml);
    var channel = $xml.find('rss').find('channel');
    var buffer = '<div class="row" id="feed-row-' + index + '"><div id="feed-panel-' + index + '" class="panel panel-info" ><div class="panel-heading" onclick="window.user.fetchFeedByUrl(\'' + feedUrl + '\');">';
    buffer += '<b>' + channel.find('title').first().text() + '</b></div>';
    buffer += '<div class="panel-body">' + channel.find('description').first().text() + '<br/><button class="btn btn-danger delete-btn" onclick="window.user.removeFeed(' + index + ', \'' + feedUrl + '\');">Remove</button></div>';
    buffer += '</div></div></div>';
    that.newsDom.html(that.newsDom.html() + buffer);

    $('#news-div>.row>.panel>.panel-heading').css('cursor', 'pointer');
    $('#news-div>.row>.panel>.label').css('cursor', 'pointer');
};
