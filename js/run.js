(function(){
    // for apple touchmove window
    document.addEventListener("touchmove",function(e){
        e.preventDefault();
    })
    window.requestAnimationFrame = (function(){
        return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
            };
    })();
    imgUrl = "http://www.einino.net/rocket/img/rocket.png";
    lineLink = "http://www.einino.net/rocket/index.html";
    descContent = '躲飞弹';
    shareTitle = '躲飞弹';
    appid = '';
    var Game = function(){
        this.constuctor();
        //this.eraseDone();
    };
    Game.prototype={
        x:0,
        y:0,
        timeLimit:300,//计时30秒
        numCount:0,
        strokeWidth:10,//半径

        restTime:0,
        runTime:0,
        startFlag:false,
        rocketWidth:10,
        pointPos:[0,0],
        toPointPos:[0,0],
        rocket:{},
        rocketKey:1,
        boomList:[],
        block:{},
        canMove:false,
        inject:{ },//动画引擎必须
        rocketImage:{},


        backgroundColor:[
            [51,204,255],
            
            [238,136,100],
            [51,204,255],
            [140,189,92],
            [178,108,196],
            [178,108,166]
        ],
        backgroundColorIndex:0,
       
        constuctor:function(){


            this.stage = $("#gameStage");
            this.timeCounter = $("#leftCounter");
            this.rightCounter = $("#rightCounter")
            this.dialog = $("#dialog");
            this.init();
            this.infoDialog();
        },
        init:function(){
            var self = this;
            this.fullWindow([this.stage]);
            this.bindEvent();
            this.rocketImageIndex =0;
             
             
            /*for( var i =1; i<=8 ; i++){
               this.loadRocketImage("img/images/rocket_0"+i+".png",i);
            }*/
            self.initDraw();
            


        },
        loadRocketImage:function(src,i){
            var self = this;
            this.loadImg(src,function(image){
                    self.rocketImage[i]= image;
                    
             })
            
        },
        /**
        *  全屏
        */
        fullWindow:function(canvas){
            this.windowWidth = $(document).width();
            this.windowHeight = $(window).height();
            $("#container").width(this.windowWidth).height(this.windowHeight);
            //不能用.width.height，否则比例拉伸
            for( var i=0; i<canvas.length; i++){
                canvas[i][0].width = this.windowWidth;
                canvas[i][0].height = this.windowHeight;
            }
            
            this.strokeWidth = this.windowWidth/30;
            this.rocketWidth = this.strokeWidth;
            this.blockWidth = this.strokeWidth;

        },
        /**
        *  注入点移动
        */
        injectPointMove:function(){
            var self = this;
            if( self.inject["stayPoint"]){
                    delete self.inject["stayPoint"];
                 }
            self.inject["movePoint"] = [function(func,pos,toPos){
                    //console.log("move")
                    self.pointPos = self.movePoint(pos,toPos,this.windowWidth/30);

                    self.drawPoint(self.pointPos);
                    //console.log(self.toPointPos)
                    //障碍物对命点生效
                    if( self.blockBoom( pos,false)){

                        self.injectRocketBoom(pos,"rgb(253,233,95)");
                        delete self.inject["movePoint"];
                        self.done("block");
                        return;
                    }

                    
                    if ( pos[0] === toPos[0] && pos[1] === toPos[1]){
                        delete self.inject["movePoint"];
                        self.inject["stayPoint"] = [function(f,p){
                            self.drawPoint(p);
                        },self.pointPos];
                       // console.log("de")
                    }
            },self.pointPos,self.toPointPos];
        },
        /**
        *  注入飞弹移动
        */
        injectRocketMove:function(){
            var self = this;
            self.inject["moveRocket"] = [function(func,pos,toPos){
                //console.log("move")
                //console.log("rockets",self.rocket)
                for(var i in self.rocket){
                    self.rocket[i] =  self.movePoint( self.rocket[i],pos,self.rocket[i][2]);
                    self.drawRocket(self.rocket[i]);
                    //if (  self.rocket[i][0] === pos[0] &&  self.rocket[i][1] === pos[1]){
                    /**
                    * 死了
                    */
                    
                    if(self.rocketBoom( self.rocket[i],pos,false,5)  ){
                        self.injectRocketBoom(self.rocket[i],"rgb(255,33,99)");
                        self.injectRocketBoom(pos,"rgb(253,233,95)");
                        delete self.inject["moveRocket"];

                        self.done();
                    }
                    
                    for(var j  in self.rocket ){
                        if ( i!= j ){
                            /**
                            * 飞弹相撞
                            */
                            if(self.rocketBoom(self.rocket[i],self.rocket[j],true)){
                                self.injectRocketBoom(self.rocket[i],"rgb(233,233,95)");
                                self.injectRocketBoom(self.rocket[j],"rgb(253,203,75)");
                                //self.drawBoom(self.rocket[i]);
                                delete self.rocket[i];
                                delete self.rocket[j];
                                //self.done();
                                break;
                                //console.log(i,j,self.rocket[i],self.rocket[j],"done")
                            }

                        }
                    }
                   // console.log(self.rocket[i]);
                   //障碍物对导弹生效
                    if ( false &&self.rocket[i] && self.blockBoom(self.rocket[i],true)){
                        self.injectRocketBoom(self.rocket[i],"rgb(233,233,95)");
                        delete self.rocket[i];
                       
                    }
                }
            },self.pointPos,self.toPointPos];
        },
        /**
        *  注入炸弹爆炸
        */
        injectRocketBoom:function(pos,color){
            var self = this;
            var p = [];
            p[0] = pos[0]
            p[1] = pos[1]
            p[2] = 100;//停留时间
            p[3] = color ? color : "";//爆炸样式
            
            self.boomList.push(p);
            //console.log(self.boomList)
            self.inject["drawBoom"] = [
                function(f,ps){
                    for(var i =0; i< self.boomList.length; i++){
                        if(ps[i][2] > 0){
                            self.drawBoom(ps[i],ps[i][3]);
                            ps[i][2]--;
                        }else{
                            self.boomList.splice(i,i);
                        }
                        if(self.boomList[0][2] == 0){
                             self.boomList.splice(0,1);
                        }
                            
                    }
                    
                },
                self.boomList
            ];
        },
        /**
        *  注入背景
        */
        injectDrawBackground:function(pos,color){
            var self = this;
            
            self.inject["drawBackground"] = [
                function(f,ps){
                    self.context = self.stage[0].getContext( '2d' );
                    var context = self.context;
                    //context.clearRect( 0, 0,self.windowWidth, self.windowHeight);
                    // console.warn(this.windowHeight,this.windowWidth)
                    context.fillStyle = "rgb("+self.backgroundColor[self.backgroundColorIndex].join(",")+")";//填充背景色
                    context.fillRect( 0, 0,self.windowWidth, self.windowHeight);
                    /**
                     * 设置障碍物
                     */
                    self.block["1"] = [self.windowWidth/2-self.blockWidth,self.windowHeight/2-90,self.blockWidth];
                    context.fillStyle = "rgb("+self.backgroundColor[self.backgroundColorIndex+1 >= self.backgroundColor.length ? self.backgroundColorIndex-1 : self.backgroundColorIndex+1].join(",")+")";//填充背景色
                    context.fillRect( self.windowWidth/2-self.blockWidth, self.windowHeight/2-90-self.blockWidth,self.blockWidth*2, self.blockWidth*2);

                    
                    
                }
            ];
        },
        /**
        *  炸弹碰撞检测
        * i first rocket j second rocket c need count?  k space
        */
        rocketBoom:function(i,j,c,k){
            if(!k) k=0;
            if(Math.abs(i[0] - j[0]) < this.rocketWidth*2 - k && Math.abs(i[1] - j[1]) < this.rocketWidth*2 - k ){
                //console.log("Rocket  Boom")
                if(c) {
                    this.numCount++;
                    this.rightCounter.html("计数:"+this.numCount);
                }
                return true;
            }
            return false;
        },
        blockBoom:function(pos,c,k){
            if(!k) k=0;
            //console.log(this.block,pos,Math.abs(pos[0] - this.block[1][0]),Math.abs(pos[1] - this.block[1][1]))
            //this.done();
            for (var i in this.block ){
                if(Math.abs(pos[0] - this.block[i][0]) < this.block[i][2] - k && Math.abs(pos[1] - this.block[i][1]) <this.block[i][2]- k ){
                    console.log("Block  Boom")
                    
                    if(c) {
                        this.numCount++;
                        this.rightCounter.html("计数:"+this.numCount);
                    }
                    return true;
                
                }
            }
            
            return false;
        },
        /**
        *  事件监听
        */
        bindEvent:function(){
            var self = this;
            this.stage.on("touchstart",function(e){
                
                var target = e.touches[0];
                 self.toPointPos = [target.pageX,target.pageY];
                 //self.drawPoint(self.toPointPos);
                self.injectPointMove();
                self.injectRocketMove();
            }).on("touchmove", function(e){
                
                var target = e.touches[0];
                self.toPointPos = [target.pageX,target.pageY];
                self.injectPointMove();
                self.injectRocketMove();

                 
                //self.drawPoint(target.pageX,target.pageY);
            }).on("touchend", function(e){


            });
            


            $("#container").on("click","#restartGame",function(){
                self.start();
                self.dialog.hide();

            }).on("click","#startGame",function(){
                    self.start();

                    $("#info").hide();
                }).on("click","#shareGame",function(){

                    shareTimeline()
                }).on("click",".contact",function(){

                });

        },
        /**
        *  清画布
        */
        clearCanvas:function(canvas){
            for ( var i =0 ; i < canvas.length; i++){
                var context = canvas[i][0].getContext('2d');
               // console.log("clear",0, 0,this.windowWidth, this.windowHeight)
                context.clearRect( 0, 0,this.windowWidth, this.windowHeight);
            
            }
            
        },
        initDraw:function(){
            this.pointPos = [this.windowWidth/2,this.windowHeight/2];
            this.toPointPos = this.pointPos;
            //this.injectPointMove();
            this.initBody();
        },

        initBody:function(){
            var self = this;
            self.context = self.stage[0].getContext( '2d' );
            var context = self.context;
            //context.clearRect( 0, 0,self.windowWidth, self.windowHeight);
            // console.warn(this.windowHeight,this.windowWidth)
            self.context = self.stage[0].getContext( '2d' );
            var context = self.context;
            //context.clearRect( 0, 0,self.windowWidth, self.windowHeight);
            // console.warn(this.windowHeight,this.windowWidth)
            context.fillStyle = "rgb("+self.backgroundColor[self.backgroundColorIndex].join(",")+")";//填充背景色
            context.fillRect( 0, 0,self.windowWidth, self.windowHeight);
            /**
             * 设置障碍物
             */
            self.block["1"] = [self.windowWidth/2-self.blockWidth,self.windowHeight/2-90,self.blockWidth];
            context.fillStyle = "rgb("+self.backgroundColor[self.backgroundColorIndex+1 >= self.backgroundColor.length ? self.backgroundColorIndex-1 : self.backgroundColorIndex+1].join(",")+")";//填充背景色
            context.fillRect( self.windowWidth/2-self.blockWidth, self.windowHeight/2-90-self.blockWidth,self.blockWidth*2, self.blockWidth*2);

            
            this.timeCounter.html("Ready");
            this.drawPoint(this.pointPos)
            
        },
        initImage:function(image){
            

        },
        /**
        *  加载图片
        */
        loadImg:function(src,callback){
            var image = new Image();
            image.src = src;
            image.onload = function() {

                callback(image);
            }
        },
        /**
        *  画点
        */
        drawPoint:function(pos){
            var x = pos[0];
            var y = pos[1];
            var context = this.stage[0].getContext("2d");
            context.fillStyle = 'rgb(255,255,255)';
            context.beginPath();
            context.arc( x, y, this.strokeWidth, 0, Math.PI * 2, true );
            context.closePath();
            context.fill();
            return context;
        },
        /**
        *  画飞弹
        */
        drawRocket:function(pos){
            var x = pos[0];
            //console.log(pos)
            var y = pos[1];
            var dx = pos[3];
            
            var dy = pos[4];
            var c = pos[5] ? pos[5] : "rgb(70,90,130)";
            var context = this.stage[0].getContext("2d");
            context.fillStyle = c;
            context.beginPath();
            context.arc( x, y, this.strokeWidth, 0, Math.PI * 2, true );
            context.closePath();
            context.fill();
          //  
            /*var distance = 8
            context.beginPath();
            context.arc( x , y, this.strokeWidth, 0, Math.PI * 2, true );
            context.arc( x + dx*distance, y + dy*distance, this.strokeWidth/2, 0, Math.PI * 2, true );
           
            context.closePath();
            context.fill();*/
            //context.rotate(Math.PI /2);
            /*var di =1;
            if( dx ==0 )
            {
                if( dy == 0){
                    di =1;
                }
                if (dy <0){
                    di =1;
                }else{
                    di = 2;
                }
            }else if( dx > 0 )
            {
                if( dy == 0){
                    di =4;
                }
                if (dy <0){
                    di =5;
                }else{
                    di = 6;
                }
            }else if( dx < 0 )
            {
                if( dy == 0){
                    di =3;
                }
                if (dy <0){
                    di =8;
                }else{
                    di = 7;
                }
            }
            var src = "img/images/rocket_0"+di+".png";
            console.log(this.rocketImage);
            context.drawImage(this.rocketImage[di], x,y);
            */
            return context;
        },
        /**
        *  画爆炸
        */
        drawBoom:function(pos,color){
            var x = pos[0];
            var y = pos[1];
            var context = this.stage[0].getContext("2d");
            //console.log("boom color:",color)
            context.fillStyle =color ? color : 'rgb(233,233,95)';
            context.beginPath();
            context.arc( x, y, this.strokeWidth*2, 0, Math.PI * 2, true );
            context.closePath();
            context.fill();
            return context;
        },
        /*
        * 移动帧
        */
        movePoint:function(pos,toPos,_step){
            var self  = this;
            var x = pos[0];
            var y = pos[1];
            var dx =0;
            var dy = 0;
            var toX = toPos[0];
            var toY = toPos[1];
            var c = pos[5];
            var step = _step ? _step : this.windowWidth/40;
            var g = step;//fix
            // sin(tan ( (toX - x) / (toY -y ))) * g;
            
            var maxG = this.windowWidth;
            //console.log("delta:",delta)
             var delta = 0;
             if( toX - x !=0)
                delta = Math.atan(Math.abs(  (toY -y )/(toX - x)));//计算角度
            if( Math.abs(x - toX ) <= 1 ){
                x  = toX;
                delta = 0;
            }
            if( Math.abs(y - toY ) <= 1){
               y  = toY;
               delta = 1;
            }
           


            if(toX > x && toY >y){
                x += Math.cos(delta)*g;
                y +=Math.sin(delta)*g;
            }else if(toX > x && toY <y){
                x += Math.cos(delta)*g;
                y -=Math.sin(delta)*g;

            }
            else if(toX < x && toY  > y){
                x -= Math.cos(delta)*g;
                y +=Math.sin(delta)*g;

            }
            else if(toX < x && toY < y){
                x -= Math.cos(delta)*g;
                y -=Math.sin(delta)*g;

            }
            /*
            else if( x < toX){
                x += g*(toX - x);
                dx = 1;
            }else{
                x -= g*(x - toX);
                dx = -1;
            }

            else if(toY > y){
                y += Math.sin(Math.atan((toY - y) / (toX -x )))*g
            }*/
            /*
            else if ( y < toY ){
                y += g*(toY - y);
                dy = 1;
            }else{
                y -= g*(y - toY);
                dy = -1;
            }*/
            /**  6 4 11
             *   2 0 7
             *   3 1 8
             *  d:  direction
             */

            //console.log("move to:",[toX,toY],"now : ",[x,y])
            // x, y , setp, drectionx,directiony, color
            return [x,y,step,dx,dy,c];

        },
        drawImage:function(image){
            var self =this;
            var context = this.context;
            var imglocatX = (self.windowWidth-image.width)/2;
            var imglocatY = (self.windowHeight-image.height)/2;
            
            context.drawImage(image, imglocatX, imglocatY,image.width, image.height);
            // context.fillRect( 0, 0,this.windowWidth, this.windowHeight);

        },
        
        /**
        * 开始游戏
        */
        start:function(){
            var self = this;
            this.startFlag = true;
            this.runTime =0;
            this.restTime=0;
            this.numCount =0;
            this.canDeal = false;
            this.rocket =[];
            this.boomList=[];
            this.backgroundColorIndex =Math.floor(this.backgroundColor.length * Math.random())
            this.rightCounter.html("计数:0");
            this.timeCounterGo();
            this.initDraw();
            this.injectDrawBackground();
            
            this.injectPointMove();
            this.injectRocketMove();
            
            this.animate();


        },
        /**
        * 创建飞弹
        */
        createRocket:function(){
            var self = this;
             self.rocket[self.rocketKey]= [ Math.random()*self.windowWidth,self.windowHeight - self.rocketWidth,this.windowWidth/40*Math.random(), 0,0,"rgb("+this.backgroundColor[this.backgroundColorIndex-1 < 0 ? 1 : this.backgroundColorIndex - 1].join(",")+")"];
            self.drawRocket( self.rocket[self.rocketKey]);
            self.rocketKey++;
            //console.log(self.rocket)
        },
        /**
        * 结束
        */
        done:function(type){

            this.animate();
            
            this.doneDialog(type);
            this.startFlag =false;;
            this.numCount = 0;
            clearInterval(this.timeInterval)
            this.timeCounter.html("计时:0")
            
            //console.log("Boom")
        },
        /**
        * 计时
        */
        timeCounterGo:function(){
            var self = this;
            this.timeInterval = setInterval(function(){
                self.runTime++;
                if ( self.startFlag && self.runTime % 10 == 0){
                   self.createRocket();
                }
                self.timeCounter.html("计时:"+((self.timeLimit-self.runTime)/10).toFixed(1));
                if( self.runTime >= self.timeLimit){
                   self.done();
                }
            },100);
        },
        doneDialog:function(type){
            var html = ' <div><p>'+this.runTime/10+'秒内我躲过'+this.numCount+'个飞弹！</p>'+'</div>'+
                '<div class="btn_wrapper"> <div id="shareGame" class="btn">右上角分享</div>'+
                '<div id="restartGame" class="btn">重新开始</div><p><a class="contact" href="http://www.chenjinya.cn?fr=weixin">about</a></p>' +
                '</div>';
            if (this.numCount == 0){
                html = ' <div><p>真遗憾</p><p>一个飞弹就把你解决了</p></div>'+
                    '<div class="btn_wrapper"> <div id="shareGame" class="btn">右上角分享</div>'+
                    '<div id="restartGame" class="btn">重新开始</div><p ><a class="contact" href="http://www.chenjinya.cn?fr=weixin">about</a></p>' +
                    '</div>';
            }
            if(type == "block"){
                html = ' <div><p>你撞墙上了！</p></p>'+this.runTime/10+'秒内我躲过'+this.numCount+'个飞弹！</p>'+'</div>'+
                '<div class="btn_wrapper"> <div id="shareGame" class="btn">右上角分享</div>'+
                '<div id="restartGame" class="btn">重新开始</div><p><a class="contact" href="http://www.chenjinya.cn?fr=weixin">about</a></p>' +
                '</div>';
            }
            

            shareTitle = this.runTime/10+'秒内我躲过'+this.numCount+'个飞弹！';
            
            this.showDialog(html);
        },
        infoDialog:function(){
            var html =  '<div id="info" class="info">'+
                '  <div><p>躲飞弹</p><p>'+this.timeLimit/10+'秒看你能躲几个？</p><p>小心撞墙哦</p></div>'+
            ' <div class="btn_wrapper"> <div id="startGame" class="btn">开始</div><div id="shareGame" class="btn">右上角分享</div><p></p>'+
            '  </div>'+
            ' </div>';
            console.log(1)
            $("#container").append(html);
            /*var html = ' <div><p>躲飞弹</p><p>'+this.timeLimit/10+'秒看你能躲几个？<br />小心撞墙哦</p></div>'+
                '<div class="btn_wrapper"> <div id="startGame" class="btn">开始</div><div id="shareGame" class="btn">右上角分享</div><p><a class="contact" href="http://www.chenjinya.cn?fr=weixin">Jinya</a></p>'+
                '</div>';
            this.showDialog(html);*/
        },
        showDialog:function(html){
            var html =' <div class="dialog_container">'+html+
                '</div>';
            this.dialog.html(html);

            this.dialog.show();
        },
        /*
         * 动画引擎
         * 依赖 inject 对象
         */
        animate:function(){
            if(! this.startFlag) return;
            this.clearCanvas([this.stage]);
            for (var i in this.inject ){
                //console.log("animate:",i)
                /*
                * [function(){},argv1,argv2...]
                */
                this.inject[i][0].apply(this,this.inject[i]);//帧移动
            }
            var self = this;
            requestAnimationFrame(function(){ self.animate() });

        }



    };

    window.Game =new Game();
})();