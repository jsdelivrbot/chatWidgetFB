//© All rights reserved. BotsCrew 2018

(function () {

    var rootUrl = "./";
    var botImageUrl = "https://rawgit.com/kachanovskyi/toyotacr-widget/master/img/toyota-logo.png";
    var getStartedUrl = "https://pavlenko.botscrew.com/web/getStarted";         //to get a FB userId. FB returns userId - IMPORTANT!

    var socketUrl = "https://pavlenko.botscrew.com/web";
    var stompClientSubscribeUrl = "/topic/greetings/";
    var stompClientSendUrl = "/app/hello";

    var appId = 1975921582622675;
    var persistentMenuList = [
        {
            title: "Disclaimer",
            postback: "DISCLAIMER"
        },
        {
            title: "Main Menu",
            postback: "MAIN_MENU"
        },
        {
            title: "Help",
            postback: "HELP_MENU"
        }
    ];

    //FB login
    window.fbAsyncInit = function () {
        FB.init({
            appId: appId,
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v2.10'
        });
        FB.AppEvents.logPageView();
    };

    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    //Loading stylesheets and scripts functions
    function loadStylesheet(url) {
        var head = document.getElementsByTagName('head')[0];
        var stylesheet = document.createElement('link');

        stylesheet.type = 'text/css';
        stylesheet.rel = 'stylesheet';
        stylesheet.href = url;
        head.appendChild(stylesheet);
    }

    function loadScript(scriptLocationAndName) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');

        script.type = 'text/javascript';
        script.src = scriptLocationAndName;
        head.appendChild(script);
    }

    function loadScriptCallback(url, callback) {
        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState) { //IE
            script.onreadystatechange = function () {
                if (script.readyState == "loaded" || script.readyState == "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else { //Others
            script.onload = function () {
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    }

    //Loading necessary stylesheets
    loadStylesheet(rootUrl + 'css/widget.css');
    loadStylesheet('https://cdnjs.cloudflare.com/ajax/libs/material-design-iconic-font/2.2.0/css/material-design-iconic-font.min.css');

    //Loading necessary socket script files
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.1.4/sockjs.min.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js");

    //Checking if jQuery library is loaded or loading it and initializing widget
    setTimeout(function () {
        (window.jQuery && init()) || loadScriptCallback("https://code.jquery.com/jquery-1.12.4.min.js", init);
    }, 1000);

    //Script build function
    function init() {
        var $ = window.jQuery;

        var anchor = $('<div>')
            .attr('id', 'widget-container')
            .appendTo($('body'));

        var chatbot = $('<div>')
            .addClass('chatbot')
            .appendTo(anchor);

        var launcher = $('<div>')
            .addClass('widget-launcher')
            .addClass('widget-effect')
            .append('<i class="zmdi zmdi-comment-text"></i>')
            .appendTo(anchor);

        var ua = navigator.userAgent;
        var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
        var Android = !!ua.match(/Android/i);
        var Mobile = !!ua.match(/Mobi/i);
        var Mac = !!ua.match(/Macintosh/i);

        var $w = $(window);

        var launcherCont = {};
        var chatTop = 480,
            chatBottom = 50,
            chatWidth = 333;
        launcherCont.bottom = 3;
        launcherCont.right = 16;
        launcherCont.width = 333;
        launcherCont.height = 20;

        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // if ($w.width() < 500) {
            chatTop = $w.height();
            chatWidth = $w.width();
            launcherCont.width = chatWidth;
            launcherCont.right = 0;
        }

        launcher.click(function () {

            var chatHeight = chatTop;

            var messageContainer = $('<div id="messageContainer" class="message-container">')
                .css('width', launcherCont.width)
                .css('height', chatHeight);

            if ($('#chat-window').length === 0) {
                var chatWindow = $('<div id="chat-window">')
                    .css('height', chatHeight)
                    .css('top', -chatHeight - 16)
                    .css('width', launcherCont.width)
                    .css('right', launcherCont.right)
                    .css('display', 'none')
                    .append(messageContainer)
                    .append(
                        $('<div class="chat-top">')
                            .css('bottom', chatHeight - chatBottom)
                            .append(
                                $('<div class="close-btn">')
                            )
                    )
                    .append(
                        $('<div class="chat-bottom">')
                            .css('width', launcherCont.width)
                            .css('height', chatBottom)
                            .append(
                                $('<div class="input-container">')
                                    .append(
                                        $('<span id="menuBtn">')
                                            .append($('<i class="zmdi zmdi-menu">'))
                                            .on('click', function () {
                                                var menu = $(".persistent-menu");
                                                menu.css('display') === 'none' ? menu.show() : menu.hide();
                                            })
                                    )
                                    .append(
                                        $('<input id="chatInput" type="text" placeholder="Enter message...">')
                                            .keypress(function (evt) {
                                                if (evt.which === 13) {
                                                    evt.preventDefault();
                                                    send();
                                                }
                                            })
                                            .on("click", function () {
                                                $(".persistent-menu").hide();
                                            })
                                    )
                                    .append(
                                        $('<a class="send-message">Send</a>').on("click", send)
                                    )
                            )
                    )
                    .appendTo(chatbot);

                var menu = $('<ul class="persistent-menu">')
                    .append($('<li class="menu-item">Menu</li>'))
                    .appendTo($(".chat-bottom"));

                persistentMenuList.forEach(function (value) {
                    $('<li class="menu-item link">')
                        .text(value.title)
                        .data("postback", value.postback)
                        .on("click", function () {
                            send("menu", $(this).data("postback"));
                            $(".persistent-menu").hide();
                        })
                        .appendTo(menu);
                });

                $('.close-btn').on("click", chatWindowClose);

                if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    // if ($w.width() < 500) {
                    chatWindow.css('top', -chatHeight);
                }
            }

            $('<div class="start-screen">')
                .append(
                    $('<div class="inner">')
                        .append(
                            $('<p class="description">Please login</p>')
                        )
                        .append(
                            $('<input type="text" placeholder="Name" >')
                                .attr('id', 'inputName')
                                .addClass('black-placeholder chatInput')
                                .css('width', '250px')
                                .css('border', '1px solid #ccc')
                                .css('border-radius', '6px')
                                .css('background', 'white')
                                .css('margin-bottom', '10px')
                                .css('box-shadow', '3px 3px 11px -3px')
                                .css('height', '44px')
                        )
                        .append('<br>')
                        .append(
                            $('<input type="text" placeholder="Email" >')
                                .attr('id', 'inputEmail')
                                .addClass('black-placeholder chatInput')
                                .css('width', '250px')
                                .css('border', '1px solid #ccc')
                                .css('border-radius', '6px')
                                .css('margin-bottom', '10px')
                                .css('box-shadow', '3px 3px 11px -3px')
                                .css('background', 'white')
                                .css('height', '44px')
                        )
                        .append('<br>')
                        .append(
                            $('<a class="login-btn fb">')
                                .css('padding', '10px')
                                .css('background', '#3a87f0')
                                .css('width', '250px')
                                .append(
                                    $('<span class="text">').text('Login')
                                )
                                .click(function () {
                                    var name = $('#inputName').val();
                                    var email = $('#inputEmail').val();
                                    if (name != '' && email != '') {
                                        $($('.start-screen')[0]).fadeOut("fast", function () {
                                            var data = {
                                                name: name,
                                                email: email
                                            };
                                            console.log(data);
                                            chatInit();                                         //mocked up version
                                            $.ajax({
                                                type: "POST",
                                                url: getStartedUrl,
                                                contentType: "application/json; charset=utf-8",
                                                dataType: "json",
                                                data: JSON.stringify(data),

                                                success: function (id) {
                                                    chatId = id;
                                                    connect();
                                                },
                                                error: function () {
                                                    console.log("Internal Server Error. Not possible to get chat id.");
                                                }
                                            });
                                        })
                                    }
                                })
                        )
                        .append('<hr class="hr-text" data-content="OR">')
                        .append(
                            $('<a class="login-btn fb">')
                                .append(
                                    $('<span class="logo">').text('f')
                                )
                                .append(
                                    $('<span class="text">').text('Login with Facebook')
                                )
                                .css('width', '250px')
                                .on("click", loginFB)
                        )
                )
                .appendTo(messageContainer);

            chatWindowShow();

            $.fn.isolatedScroll = function () {
                this.bind('mousewheel DOMMouseScroll ontouchstart ontouchmove', function (e) {
                    console.log('scrolling');
                    var delta = e.wheelDelta || (e.originalEvent && e.originalEvent.wheelDelta) || -e.detail,
                        bottomOverflow = this.scrollTop + $(this).outerHeight() - this.scrollHeight >= 0,
                        topOverflow = this.scrollTop <= 0;

                    if ((delta < 0 && bottomOverflow) || (delta > 0 && topOverflow)) {
                        e.preventDefault();
                    }
                });
                return this;
            };
            messageContainer.isolatedScroll();
        });

        function chatWindowShow() {
            $('#chat-window').show();
            $("#chatInput").val('');

            if (/webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // if ($w.width() < 500) {
                $('body')
                    .animate({
                        scrollTop: 0
                    }, 0)
                    .css('overflow-y', 'hidden')
                    .css('max-height', chatTop)
                    .wrapInner('<div id="overflowWrapper" />');
                $('#overflowWrapper').css('overflow-y', 'hidden').css('height', chatTop);
            } else if (/Android/i.test(navigator.userAgent)) {
                $('body')
                    .scrollTop(0)
                    .css('overflow', 'hidden')
                    .css('height', '100vh');
            }
        }

        function chatWindowClose() {
            $('#chat-window').hide();
            $('.chat-close').hide();

            if (/webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // if ($w.width() < 500) {
                $("#overflowWrapper").contents().unwrap();
                $('body')
                    .css('overflow-y', 'auto')
                    .css('max-height', 'none');
            } else if (/Android/i.test(navigator.userAgent)) {
                $('body')
                    .css('overflow-y', 'auto')
                    .css('height', 'auto');
            }
        }

        var container = null;

        function setResponse(val) {
            var typing = $('.message-container').find($('#wave'));

            if (typing) {
                typing.parent().remove();
            }

            if (!container) {
                container = $('<div class="message-outer bot">')
                    .append(
                        $('<div class="flex-container">')
                            .append(
                                $('<div class="bot-icon">')
                                    .append(
                                        $('<img/>').attr('src', botImageUrl)
                                    )
                            )
                            .append($('<div class="message-wrapper">'))
                    );
            } else {
                container = $(".message-outer.bot").last();
            }

            var sendBtn = $('.send-message');
            var msgWrapper = container.find(".message-wrapper");
            var message = $('<div class="chat-message bot">');
            var btnWidth,
                scrCont,
                scrContWidth = 0;

            if (val.sender_action) {
                var wave = $('<div id="wave">')
                    .append($('<span class="dot">'))
                    .append($('<span class="dot">'))
                    .append($('<span class="dot">'));
                msgWrapper.append(
                    $('<div class="message-row">')
                        .append(wave)
                );
            }

            if ((val.message !== null) && (val.message !== undefined)) {
                if (val.message.text !== undefined) {
                    message.text(val.message.text);
                    sendName(val.message.text, "", true);
                } else if (val.message.attachment !== undefined) {
                    message.text(val.message.attachment.payload.text);
                }

                // setTimeout(function () {
                if (message.text().length && message.text().trim()) {
                    $('<div class="message-row">')
                        .append(message)
                        .appendTo(msgWrapper);
                }

                if (val.message.quick_replies) {
                    scrCont = $('<div>')
                        .addClass('scrolling-container')
                        .addClass('quick')
                        .append(
                            $('<span class="arrow">')
                                .attr('id', 'leftArrow')
                                .text('<')
                                .click(
                                    function () {
                                        var repliesList = $('#scroll');
                                        var rightArrow = $('#rightArrow');
                                        repliesList
                                            .clearQueue()
                                            .stop()
                                            .animate({
                                                scrollLeft: "-=" + 200
                                            }, "fast", function () {
                                                if (repliesList.scrollLeft() < rightArrow.width()) {
                                                    $('#leftArrow').hide();
                                                }

                                                rightArrow.css('display', 'flex');
                                            });
                                    }
                                )
                        )
                        .append(
                            $('<span class="arrow">')
                                .attr('id', 'rightArrow')
                                .text('>')
                                .click(
                                    function () {
                                        var repliesList = $('#scroll');
                                        var leftArrow = $('#leftArrow');
                                        repliesList
                                            .clearQueue()
                                            .stop()
                                            .animate({
                                                scrollLeft: "+=" + 200
                                            }, "fast", function () {

                                                if (repliesList.scrollLeft() + repliesList.width() >=
                                                    (repliesList.get(0).scrollWidth - leftArrow.width())) {

                                                    $('#rightArrow').hide();

                                                }

                                                leftArrow.css('display', 'flex');
                                            });
                                    }
                                )
                        )
                        .append(
                            $('<ul>')
                                .attr('id', 'scroll')
                        )
                        .appendTo(msgWrapper);

                    val.message.quick_replies.forEach(function (item) {
                        $('<li>')
                            .text(item.title)
                            .attr('payload', item.payload)
                            .click(function () {
                                send("btn", $(this));
                                $(this).closest('.scrolling-container.quick').remove();
                            })
                            .appendTo(scrCont.find('ul'));
                    });

                    //as DOM updates asynchronously, setTimeout is used, otherwise each width === 0
                    setTimeout(function () {
                        scrCont.find('ul').find('li').each(function () {
                            console.log($(this).css("width"));
                            scrContWidth += parseInt($(this).css('width'), 10);
                            console.log(scrContWidth);
                        });

                        if (scrContWidth > parseInt($("#scroll").css('width'), 10)) {
                            scrCont.addClass('scrollable');
                        }

                        if ($('.scrolling-container').width() > scrContWidth) {
                            $('#leftArrow').hide();
                            $('#rightArrow').hide();
                        } else {
                            $('#leftArrow').css('display', 'flex');
                            $('#rightArrow').css('display', 'flex');
                        }

                        if ($('.quick').find('ul').scrollLeft() === 0) {
                            $('#leftArrow').hide();
                        }
                    });
                }

                if (val.message.attachment && val.message.attachment.payload.elements) {

                    scrCont = $('<div>')
                        .addClass('scrolling-container')
                        .append(
                            $('<span class="arrow">')
                                .text('<')
                                .click(
                                    function () {
                                        var navwidth = parseInt(scrCont.find('ul').css('width'), 10);
                                        scrCont.find('ul')
                                            .animate({
                                                scrollLeft: "-=" + navwidth
                                            }, "fast");
                                    }
                                )
                        )
                        .append(
                            $('<span class="arrow">')
                                .text('>')
                                .click(
                                    function () {
                                        var navwidth = parseInt(scrCont.find('ul').css('width'), 10);

                                        scrCont.find('ul')
                                            .animate({
                                                scrollLeft: "+=" + navwidth
                                            }, "fast");
                                    }
                                )
                        )
                        .append(
                            $('<ul>')
                        );

                    if (val.message.attachment.payload.template_type === "list") {
                        scrCont.addClass('list');
                    }

                    scrCont.appendTo(msgWrapper);


                    val.message.attachment.payload.elements.forEach(function (item) {
                        var generic = $('<li>').addClass('generic');

                        if (item.image_url) {
                            generic.append(
                                $('<div>')
                                    .addClass('generic-img')
                                    .append(
                                        $('<div>')
                                            .addClass('inner')
                                            .css('background-image', 'url("' + item.image_url + '")')
                                    )
                            )
                        }

                        if (item.title || item.subtitle) {
                            var info = $('<div>')
                                .addClass('generic-info')
                                .appendTo(generic)
                        }

                        if (item.title) {
                            $('<p>')
                                .addClass('title')
                                .text(item.title)
                                .appendTo(info)
                        }
                        if (item.subtitle) {
                            $('<p>')
                                .addClass('subtitle')
                                .text(item.subtitle)
                                .appendTo(info)
                        }

                        if (item.buttons) {

                            item.buttons.forEach(function (entry) {
                                var btn = $('<a>')
                                    .addClass('generic-btn')
                                    .text(entry.title);

                                if (entry.type === "postback") {
                                    btn
                                        .attr('payload', entry.payload)
                                        .click(function () {
                                            send("btn", $(this));
                                        });
                                } else if (entry.type === "web_url") {
                                    btn
                                        .attr('href', entry.url)
                                        .attr('target', '_blank')
                                }

                                btn.appendTo(generic);

                            })

                        }

                        generic.appendTo(scrCont.find('ul'));
                    });

                    setGenericWidth(scrCont);
                }

                if (val.message.attachment && val.message.attachment.payload.buttons) {

                    message.css('border-radius', '6px 6px 0 0');
                    btnWidth = message.outerWidth() + 1;

                    val.message.attachment.payload.buttons.forEach(function (entry) {

                        var btn = $('<a class="chat-message button">').text(entry.title);

                        if (btnWidth !== 0) {
                            // btn.css('width', btnWidth);
                        } else if ($('.scrolling-container.list') && !btnWidth) {
                            btnWidth = parseInt($('.scrolling-container.list').css('width'), 10);
                            btn
                                .css('max-width', '100%')
                                .css('margin', '0 5px')
                                .css('width', btnWidth - 10)
                                .css('top', '-4px');
                        } else {
                            btn.css('display', 'inline-block');
                        }

                        if (entry.type === "postback") {
                            btn
                                .attr('payload', entry.payload)
                                .click(function () {
                                    send("btn", $(this));
                                });
                        } else if (entry.type === "web_url") {
                            btn
                                .attr('href', entry.url)
                                .attr('target', '_blank')
                        }

                        btn.appendTo(msgWrapper)
                    });
                }

                if (val.message.attachment && val.message.attachment.type === "image" && val.message.attachment.payload.url) {

                    $('<div class="message-row">')
                        .append(
                            $('<img class="image_simple" alt="image sent by chatbot"/>')
                                .attr("src", val.message.attachment.payload.url)
                        )
                        .appendTo(msgWrapper);

                }

                chatScrollBottom();
                // }, 333);
            }

            container.appendTo($('#chat-window').find('.message-container'));
            chatScrollBottom();
        }

        var stompClient = null;

        function connect() {
            console.log('stomp connect');
            var socket = new SockJS(socketUrl);
            stompClient = Stomp.over(socket);
            stompClient.connect({}, function (frame) {
                // setConnected(true);
                // console.log('Connected: ' + frame);
                stompClient.subscribe(stompClientSubscribeUrl + chatId, function (greeting) {
                    userId = JSON.parse(greeting.body).recipient.id;
                    showGreeting(JSON.parse(greeting.body));
                });
                sendName("hi");
            });
            $('html, body').animate({
                scrollTop: 300
            });
        }

        function disconnect() {
            if (stompClient != null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }

        function sendName(message, param, echo) {
            var data = {
                object: "page",
                entry: [
                    {
                        id: "555",
                        time: 1458692752478,
                        messaging: [
                            {
                                sender: {
                                    id: chatId
                                },
                                recipient: {
                                    id: "567"
                                },
                                message: null
                            }

                        ]
                    }
                ]
            };

            if (param === "btn") {
                data.entry[0].messaging[0].postback = {
                    payload: message
                }
            } else {
                data.entry[0].messaging[0].message = {
                    text: message
                }
            }

            if (echo) {
                data.entry[0].messaging[0].message.is_echo = true;
            }

            // stompClient.send(stompClientSendUrl, {}, JSON.stringify(data));
        }

        function showGreeting(message) {
            setResponse(message, setGenericWidth);
        }

        var chatId = null,
            accessToken = null;

        $(window).load(function () {

            FB.getLoginStatus(function (response) {
                console.log(response);

                if (response.status === 'connected') {
                    console.log('Logged in FB.');
                    FB.api('/me', function (response) {
                        chatId = response.id;
                        accessToken = FB.getAuthResponse()['accessToken'];
                        chatInit(chatId, accessToken);
                    });
                    // FB.logout(function(response) {
                    //     console.log('logged out');
                    // });
                }

            });
        });


        function loginFB() {
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    console.log('Already logged in FB.');
                    FB.api('/me', function (response) {
                        chatId = response.id;
                        accessToken = FB.getAuthResponse()['accessToken'];
                        chatInit(chatId, accessToken);
                    });
                } else {
                    FB.login(function () {
                        FB.api('/me', function (response) {
                            chatId = response.id;
                            if (response.authResponse) {
                                accessToken = FB.getAuthResponse()['accessToken'];
                            }

                            if (chatId && (chatId !== undefined)) {
                                console.log('You are successfully logged in FB.');
                                chatInit(chatId, accessToken);
                            }
                        });
                    });
                }
            })
        }

        function chatInit(id, token) {
            $($('.start-screen')[0]).fadeOut("fast", function () {
                var data = {
                    id: id,
                    token: token
                };
                $.ajax({
                    // type: "POST",
                    type: "GET",            //mocked up version, should be post with data: !!!
                    // url: getStartedUrl,
                    url: './data/response3.json',           //mocked up version,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: JSON.stringify(data),

                    success: function (id) {
                        setResponse(id);            //mocked up version, should be connect()
                        // connect();
                    },
                    error: function () {
                        console.log("Internal Server Error. Not possible to get chat id.");
                        loginFB();
                    }
                });
            });
        }

        function send(param, elem) {

            $('.scrolling-container.quick').remove();
            $(".persistent-menu").hide();

            var input = $("#chatInput");
            var text = input.val();
            container = null;

            if (param === "btn") {
                text = elem.text();
            }

            if (param === "menu") {
                text = elem;
            }

            if (text.length && text.trim()) {
                input.val('');

                if (param === "btn") {
                    sendName(elem.attr('payload'), "btn");
                } else {
                    sendName(text);
                }

                $('<div class="message-outer user">')
                    .append(
                        $('<div class="chat-message user">').text(text)
                    )
                    .appendTo($('#chat-window').find('.message-container'));

            } else {
                input.val('').focus();
            }
            chatScrollBottom();

        }

        function chatScrollBottom() {
            var messageContainer = $("#messageContainer");
            messageContainer.animate({scrollTop: messageContainer.prop("scrollHeight")}, 0);
        }

        var resizeTimer;

        // var genericScrollValue;

        function setGenericWidth(scrCont) {

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(function () {

                // genericScrollValue = parseInt($('.chat-container').css('width'), 10);

                if (scrCont === undefined) {
                    scrCont = $(".scrolling-container:not(.quick)").last();
                }

                scrCont.find('.generic-info').each(function () {
                    var genImg = $(this).parent().find('.generic-img');

                    if (genImg) {
                        var genImgWidth = parseInt($(this).parent().find('.generic-img').find('.inner').css('width'), 10);
                        genImg.find('.inner').css('height', genImgWidth / 2);
                    }
                });

                var scrContWidth = 0;

                scrCont.find('.generic').each(function () {
                    scrContWidth += parseInt($(this).css('width'), 10);
                    console.log(scrContWidth);
                });

                console.log(scrCont[0]);

                if (scrContWidth > parseInt($(scrCont[0]).css('width'), 10)) {
                    $(scrCont[0]).addClass('scrollable');

                    scrContWidth = parseInt($('#messageContainer .message-outer.bot').css('width'), 10) - 44 - 40;

                    $(scrCont[0]).find('.generic-info').each(function () {
                        $(this).css('width', scrContWidth);
                        var genImg = $(this).parent().find('.generic-img');

                        if (genImg) {
                            var genImgWidth = parseInt($(this).parent().find('.generic-img').find('.inner').css('width'), 10);
                            genImg.find('.inner').css('height', genImgWidth / 2);
                        }
                    });
                }

                chatScrollBottom();

            }, 10);

        }

        // $(window).unload(function () {
        //     disconnect();
        // });

        $(window)
            .on('scroll resize', function () {
                // getVisible($('.slide-1'));
                // setChatSize();
            })
            .on('resize', function () {
                // setGenericWidth();
            });

        $(window).resize(function () {
            var repliesList = $('#scroll');
            if ($('.scrolling-container').width() > repliesList.width()) {
                $('#leftArrow').hide();
                $('#rightArrow').hide();
            } else {
                $('#leftArrow').css('display', 'flex');
                $('#rightArrow').css('display', 'flex');
            }
            if (repliesList.scrollLeft() === 0) {
                $('#leftArrow').hide();
            }
        });

        window.initializeShopchat = init;
        return true;
    }
})();