$(function() {
    window.UNIX_TIME_PER_DAY = 86400;
    window.DEFAULT_LOADS = 25;
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
    $('.white-div').css('height', topHeight.toString() + 'px');
}

function registerEvents() {
    $('#username-input').focus();

    $(window).resize(function() {
        setNewsDivTop();
    });

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
        // if($(this).html() === 'Feeds') {
        //     $(this).html('All news');
        //     window.user.showFeeds();
        // }
        // else {
        $(this).html('Feeds');
        window.user.showFeeds();
        // }
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
                  window.user.showFeeds();
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

User.prototype.fetchFeedByUrl = function(url, loadAll) {
    $.get('php/readXml.php',
            {
                url: url
            }).done(function(data) {
                NProgress.start();
                // !!!do not create new FeedParser instance!!!
                $('#news-div').html('');
                NProgress.set(0.2);
                window.feedParser.parseXmlData(url, data, loadAll, false);
                NProgress.set(0.7);
                $('#feeds-btn').html('Feeds');
                NProgress.done();
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
                    window.user.fetchFeedByUrl(url, false);
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
        that.parseXmlData(rss, data, false, true);
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

FeedParser.prototype.parseXmlData = function(feedUrl, xmlString, loadAll, loadingAllNews) {
    var timestamp = new Date().getTime();
    var that = this;
    var xml = $.parseXML(xmlString),
        $xml = $(xml);
    var counter = 0;


    var items,
        pubDateTag = '',
        descriptTag = '',
        channelLink,
        channelTitle;
    if((items = $xml.find('rss').find('channel').find('item')).length !== 0) { //default rss
        pubDateTag = 'pubDate';
        descriptTag = 'description';
        channelTitle = $xml.find('rss').find('channel').find('title').first().text()
        channelLink = $xml.find('rss').find('channel').find('link').first().text()
    }
    else if((items = $xml.find('feed').find('entry')).length !== 0) { //default atom
        pubDateTag = items.find('updated').length !== 0 ? 'updated' : 'modified';
        descriptTag = items.find('summary').length !== 0 ? 'summary' : 'content';
        channelTitle = $xml.find('feed').find('title').first().text();
        channelLink = $xml.find('feed').find('link').first().text().length !== 0 ? $xml.find('feed').find('link').first().text() : $xml.find('feed').find('link').first().attr('href');
    }
    else { //bad structured feed
        items = $xml.find('entry');
        pubDateTag = items.find('updated').length !== 0 ? 'updated' : 'modified';
        descriptTag = items.find('summary').length !== 0 ? 'summary' : 'content';
        channelTitle = $xml.find('title').first().text();
        channelLink = $xml.find('link').first().attr('href');
    }

    items.each(function() {
        ++counter;
        if(loadAll === false && counter >= window.DEFAULT_LOADS) {
            return false;
        }

        var pubDate = $(this).find(pubDateTag).text();
        pubDate = moment(pubDate).startOf('minutes').fromNow();
        var newsLink = $(this).find('link').text().length !== 0 ? $(this).find('link').text() : $(this).find('link').attr('href');

        var buffer = '<div class="row"><div class="panel panel-default"><div class="panel-heading">';
        if(newsLink.length !== 0) {
            buffer += '<a href="' + newsLink + '" target="_blank"><b>' + $(this).find('title').text() + '</b></a>';
        }
        else {
            buffer += '<b>' + $(this).find('title').text() + '</b>';
        }
        buffer += '<span class="feed-title-span"><a target="_blank" href="' + channelLink + '">' + channelTitle  + '</a></span></div>';
        buffer += '<div class="panel-body"><div class="publish-date-div">' + pubDate + '</div>' + $(this).find(descriptTag).text() + '</div>';
        buffer += '</div></div></div>';
        that.newsDom.html(that.newsDom.html() + buffer);
    });

    if(loadAll === false && loadingAllNews === false) {
        var html = '<div class="row"><div class="load-all-div well text-center">Load all news.</div></div>';
        that.newsDom.html(that.newsDom.html() + html);
        $('.load-all-div').css('cursor', 'pointer').on('click', function() {
            window.user.fetchFeedByUrl(feedUrl, true);
        });
    }
};

FeedParser.prototype.parseFeed = function(xmlString, feedUrl, index) {
    var that = this;
    var xml = $.parseXML(xmlString),
        $xml = $(xml);

    var channel,
        title = '',
        description = '';
    if((channel = $xml.find('rss').find('channel')).length !== 0) { //default rss
        title = channel.find('title').first().text();
        description = channel.find('description').first().text(); //default atom
    }
    else if((channel = $xml.find('feed')).length !== 0) {
        title = channel.find('title').first().text();
        description = channel.find('subtitle').first().text();
    }
    else { //bad structured feed
        title = $xml.find('title').first().text();
        description = $xml.find('subtitle').first().text();
    }

    var buffer = '<div class="row" id="feed-row-' + index + '"><div id="feed-panel-' + index + '" class="panel panel-info" ><div class="panel-heading" onclick="window.user.fetchFeedByUrl(\'' + feedUrl + '\', false);">';
    buffer += '<b>' + channel.find('title').first().text() + '</b></div>';
    if(description.length !== 0) {
        buffer += '<div class="panel-body">' + channel.find('description').first().text() + '<br/><button class="btn btn-danger delete-btn" onclick="window.user.removeFeed(' + index + ', \'' + feedUrl + '\');">Unsubscribe</button></div>';
    }
    else {
        buffer += '<div class="panel-body"><button class="btn btn-danger delete-btn" onclick="window.user.removeFeed(' + index + ', \'' + feedUrl + '\');">Unsubscribe</button></div>';
    }
    buffer += '</div></div></div>';

    that.newsDom.html(that.newsDom.html() + buffer);

    $('#news-div>.row>.panel>.panel-heading').css('cursor', 'pointer');
    $('#news-div>.row>.panel>.label').css('cursor', 'pointer');
};
