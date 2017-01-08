var BackUrl = ------------ // server url
var myapp = angular.module('myapp');

//making videos work with making url trustable
myapp.filter("trustUrl", ['$sce', function($sce) {
    return function(recordingUrl) {
        return $sce.trustAsResourceUrl(recordingUrl);
    };
}]);


//For uploading files
myapp.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function() {
                scope.$apply(function() {});
            });
        }
    };
}]);

//for uploading files
myapp.service('fileUpload', ['$http', function($http) {
    this.uploadFileToUrl = function(file, uploadUrl, func) {
        var fd = new FormData();
        fd.append('file', file);

        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        })

        .success(function() {
            func();
        })

        .error(function() {});
    }
}]);

//multi tag search
myapp.filter('tagFiltering', function() {
    return function(items, tag, tags) {
        var filtered = [];
        var times = 0;
        var trues = 0;
        angular.forEach(items, function(item) {
            var notset = true;
            if (tags.length > 0) {
                times = 0;
                trues = 0;
                angular.forEach(tags, function(value, key) {
                    times++;
                    angular.forEach(item.tags, function(value2, key2) {
                        if (value.tag.toUpperCase() == value2.tag.toUpperCase()) {
                            trues++;
                        }
                    });
                });
            }

            if (times == trues) {
                if (!filtered.includes(item)) {
                    if (tag) {
                        angular.forEach(item.tags, function(value, key) {
                            if (value.tag.toUpperCase().includes(tag.toUpperCase()) && notset) {
                                filtered.push(item)
                                notset = false;
                            }
                        });
                    } else {
                        filtered.push(item);

                    }
                }
            }
        });
        return filtered;
    };
});



// #    # #####  #       ####    ##   #####     #    # # ###### #    #
// #    # #    # #      #    #  #  #  #    #    #    # # #      #    #
// #    # #    # #      #    # #    # #    #    #    # # #####  #    #
// #    # #####  #      #    # ###### #    #    #    # # #      # ## #
// #    # #      #      #    # #    # #    #     #  #  # #      ##  ##
//  ####  #      ######  ####  #    # #####       ##   # ###### #    #

myapp.controller('route1', function($scope, fileUpload, $state) {
    $scope.imageinfo = {};
    $scope.imageinfo.tags = [];
    $("#input-id").fileinput({
        showCaption: false,
        allowedFileExtensions: ['mp3', 'mp4', 'webm'],
        allowedPreviewTypes: ['video', 'audio'],
        maxFileCount: 1,
        showPreview: true,
        showUpload: false,
        showRemove: false
    });


///////////////websocket/////////////////////////////////////////////////////////////////////////

    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if (!window.WebSocket) {
        content.html($('<p>', {
            text: 'Sorry, but your browser doesn\'t ' +
                'support WebSockets.'
        }));
        $('span').hide();
        return;
    }
    var connection = new WebSocket('ws://' + BackUrl + ':8000');
    //  connection.binaryType = "blob"; //blob arraybuffer
    connection.onopen = function() {
        // var foo = { "data": "testingtestinfilehereput to database"}
        //   connection.send(JSON.stringify(foo));
    };
    connection.onerror = function(error) {
        console.log(
            'Sorry, but there\'s some problem with your ' +
            'connection or the server is down.'
        );
    };
    //incoming
    connection.onmessage = function(message) {
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            //console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        //console.log(message);
    };
    setInterval(function() {
        if (connection.readyState !== 1) {
            console.log("No connection")
        }
    }, 3000);


/////////////////////////////////////////////////////////////////////////////////////////////////////


    $('#input-id').change(function() {
        $scope.imageinfo = {};
        $scope.imageinfo.tags = [];
        $(".inputs").css("visibility", "visible");
        if (!this.files.length) return;
        $scope.sampleFile = this.files[0];
        //console.log($scope.sampleFile.name);
        $scope.imageinfo.name = $scope.sampleFile.name;
        $scope.imageinfo.name = $scope.imageinfo.name.substr(0, $scope.imageinfo.name.lastIndexOf('.'));
        var ending = $scope.sampleFile.name.split('.').pop();
        $scope.imageinfo.whatis = "file";
        $scope.imageinfo.filename = $scope.sampleFile.name;
        $scope.imageinfo.tags.push({
            'tag': ending
        }, {
            'tag': $scope.imageinfo.name
        });
    });


    $scope.addTag = function() {
        var itsin = true;
        angular.forEach($scope.imageinfo.tags, function(value, key) {
            if ($scope.imageinfo.tags[key].tag == $scope.tag) {
                itsin = false;
            }
        });

        if (itsin) {
            if ($scope.tag != "") {
                $scope.imageinfo.tags.push({
                    'tag': $scope.tag
                });
                $scope.tag = "";
                $(".uploadButton").css("visibility", "visible");
            }
        }



    }


    $scope.sendMessage = function(msg) {
        if (!msg) {
            return;
        }
        var foo = {
            "data": msg
        }
        connection.send(JSON.stringify(foo));
    };


    $scope.delTag = function(index) {
        var amount = 0;
        angular.forEach($scope.imageinfo.tags, function(value, key) {
            amount++;
        });
        if (amount > 2) {
            $scope.imageinfo.tags.splice(index, 1);
            if (amount == 3) {
                $(".uploadButton").css("visibility", "hidden");
            }
        }

    }

    // #     # ######  #       #######    #    ######     ####### ### #       #######
    // #     # #     # #       #     #   # #   #     #    #        #  #       #
    // #     # #     # #       #     #  #   #  #     #    #        #  #       #
    // #     # ######  #       #     # #     # #     #    #####    #  #       #####
    // #     # #       #       #     # ####### #     #    #        #  #       #
    // #     # #       #       #     # #     # #     #    #        #  #       #
    //  #####  #       ####### ####### #     # ######     #       ### ####### #######


    $scope.uploadFile = function() {
        var file = $scope.sampleFile;
        if (connection.readyState !== 1) {
            return;
        }

        var uploadUrl = "http://" + BackUrl + ":3000/upload";
        fileUpload.uploadFileToUrl(file, uploadUrl, $scope.uploadDone);
        $scope.sendMessage($scope.imageinfo);
        $(".uploadButton").css("visibility", "hidden");
    };


    $scope.uploadDone = function() {
        $state.go('Video');
    }


    var taginput = document.getElementById("tags");
    taginput.addEventListener("keydown", function(e) {
        if (e.keyCode === 13) {
            $scope.addTag();
            $scope.$apply();

        }
    });

    // #    # # #####  ######  ####     #    # # ###### #    #
    // #    # # #    # #      #    #    #    # # #      #    #
    // #    # # #    # #####  #    #    #    # # #####  #    #
    // #    # # #    # #      #    #    #    # # #      # ## #
    //  #  #  # #    # #      #    #     #  #  # #      ##  ##
    //   ##   # #####  ######  ####       ##   # ###### #    #


}).controller('route2', function($scope, $http) {
    $scope.search = {};
    $scope.search.tags = [];
    $scope.videos = {};
    $scope.BackUrl = BackUrl;
    $scope.taglist = [];



///////////////////////////////websocket////////////////////////////////////////////

    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if (!window.WebSocket) {
        content.html($('<p>', {
            text: 'Sorry, but your browser doesn\'t ' +
                'support WebSockets.'
        }));
        $('span').hide();
        return;
    }
    var connection = new WebSocket('ws://' + BackUrl + ':8000');
    connection.onopen = function() {

        $scope.getdata();

    };
    connection.onerror = function(error) {
        console.log(
            'Sorry, but there\'s some problem with your ' +
            'connection or the server is down.'
        );
    };
    //incoming
    connection.onmessage = function(message) {
        try {
            var json = JSON.parse(message.data);
            if (json.type == "files") {
                $scope.videos = json.files;

                $scope.videos.forEach(function(entry, id) {
                    $scope.videos[id].number = id;
                });


                console.log($scope.videos);
                $scope.$apply();
                $scope.taglistings();
            }

        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
    };


/////////////////////////////////////////websocket////////////////////////////////////////////////////////////7

    $scope.taglistings = function() {
        $scope.taglist = [];
        var tagarray = [];

        angular.forEach($scope.videos, function(value, key) {
            angular.forEach(value.tags, function(value2, key2) {
                var index = tagarray.indexOf(value2.tag);
                if (index === -1) {
                    tagarray.push(value2.tag);
                    $scope.taglist.push({
                        "tag": value2.tag,
                        "amount": 1
                    });
                } else {
                    $scope.taglist[index].amount++;
                }
            });
        });


    }




    $scope.getdata = function() {
        $scope.imageinfo = {};
        $scope.imageinfo.whatis = "givedata";
        var msg = $scope.imageinfo;
        if (!msg) {
            return;
        }
        //  console.log(msg);
        var foo = {
            "data": msg
        }
        connection.send(JSON.stringify(foo));
    }


    $scope.modalopen = function(a) {
        $scope.modal = {};
        $scope.modal.index = a;
        $scope.modal.name = $scope.videos[a].name;
        $scope.modal.thumb = "http://" + BackUrl + ":3000/" + $scope.videos[a].thumb;
        $scope.modal.video = "http://" + BackUrl + ":3000/files/" + $scope.videos[a].folder + "/" + $scope.videos[a].filename;
        $scope.modal.video = $scope.modal.video.split(' ').join('%20');
        $scope.modal.tags = $scope.videos[a].tags;
        $scope.modal.id = $scope.videos[a]._id;
    }


    $("#modalname").focusout(function() {
            $scope.videos[$scope.modal.index].name = $scope.modal.name;
            var bar = {};
            bar.whatis = "editname";
            bar.name = $scope.modal.name;
            bar.to = $scope.modal.id;
            var msg = bar;
            var foo = {
                "data": msg
            };
            connection.send(JSON.stringify(foo));
        });

    $scope.addTag = function() {
        var itsin = true;
        angular.forEach($scope.modal.tags, function(value, key) {
            if ($scope.modal.tags[key].tag == $scope.tag) {
                itsin = false;
            }
        });
        if (itsin) {
            if ($scope.tag != "") {
                $scope.modal.tags.push({
                    'tag': $scope.tag
                });
                var bar = {};
                bar.whatis = "addtag";
                bar.tag = $scope.tag;
                bar.to = $scope.modal.id;
                var msg = bar;
                //  console.log(msg);
                var foo = {
                    "data": msg
                }
                connection.send(JSON.stringify(foo));
                $scope.tag = "";
            }
        }
    }


    $scope.delTag = function(index) {
        var amount = 0;
        angular.forEach($scope.modal.tags, function(value, key) {
            amount++;
        });
        if (amount > 3) {
            alert($scope.modal.tags[index]);

            var bar = {};
            bar.whatis = "deltag";
            bar.tag = $scope.modal.tags[index];
            bar.to = $scope.modal.id;
            var msg = bar;
            var foo = {
                "data": msg
            }
            connection.send(JSON.stringify(foo));
            $scope.modal.tags.splice(index, 1);
        }
    }


    function addSearchTag() {
        var itsin = true;
        angular.forEach($scope.search.tags, function(value, key) {
            if ($scope.search.tags[key].tag == $scope.search.tag) {
                itsin = false;
            }
        });
        if (itsin) {
            var element = {};
            element.tag = $scope.search.tag;
            $scope.search.tags.push(element);
            $scope.search.tag = "";
        }
    }


    $scope.delSearchTag = function(index) {
        $scope.search.tags.splice(index, 1);
    }

//check for enter for tahg input
    var taginput = document.getElementById("searchBar");
    taginput.addEventListener("keydown", function(e) {
        if (e.keyCode === 13) {
            addSearchTag();
            $scope.$apply();
        }
    });


});
