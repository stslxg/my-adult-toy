angular.module('user', ['ngRoute','firebase'])

    .factory("Products", function ($firebase) {
		 var products_ref = new Firebase('https://my-adult-toy.firebaseio.com/products');
		 return $firebase(products_ref);
	     })

    .config(function ($routeProvider) {
		$routeProvider
		    .when('/', {
			      controller:'ListCtrl',
			      templateUrl:'template/list.html'
			  })
		    .when('/new', {
			      controller:'CreateCtrl',
			      templateUrl:'template/detail.html'
			  })
		    .otherwise({
				   redirectTo:'/'
			       });
	    })

    .controller('Auth0Ctrl', function ($rootScope, $scope, $window, $firebaseAuth) {
		    var ref = new Firebase('https://my-adult-toy.firebaseio.com');
		    $rootScope.auth = $firebaseAuth(ref);
		    $rootScope.$on("$firebaseAuth:login", function (e, user) {
				       if (user)
					   $window.location.href = "user.html";
				   });
		    $scope.onClickLoginButton = function () {
			$rootScope.auth.$login('github');
		    };
		})

    .controller('AuthCtrl', function ($rootScope, $scope, $window, $firebaseAuth) {
		    var ref = new Firebase('https://my-adult-toy.firebaseio.com');
		    $rootScope.auth = $firebaseAuth(ref);
		    $rootScope.$on("$firebaseAuth:logout", function () {
				       $window.location.href = "index.html";
				   });
		    $rootScope.$on("$firebaseAuth:login", function (e, user) {
				       if (user)
					   if ($rootScope.init_ctrl !== undefined)
					       $rootScope.init_ctrl(user);
				   });
		    $scope.onClickLogoutButton = function () {
			$rootScope.auth.$logout();
		    };
		})

    .controller('Auth1Ctrl', function ($rootScope, $scope, $firebaseAuth) {
		    var ref = new Firebase('https://my-adult-toy.firebaseio.com');
		    $rootScope.auth = $firebaseAuth(ref);
		    $rootScope.$on("$firebaseAuth:login", function (e, user) {
				   if (user)
				       $scope.user = user;
				       if ($rootScope.init_ctrl !== undefined)
					   $rootScope.init_ctrl(user);
				   });
		})

    .controller('ListProductsCtrl', function ($rootScope, $scope, Products) {
		    $rootScope.init_ctrl = function (user) {
			$scope.user = user;
		    };

		    $scope.products = Products;
		})

    .controller('ListCtrl', function ($scope, $rootScope, $firebase, Products) {
		    $rootScope.init_ctrl = function (user) {
			$scope.user = user;
			var orders_ref = new Firebase('https://my-adult-toy.firebaseio.com/users/'+user.uid+'/orders');
			$scope.orders = $firebase(orders_ref);

			$scope.removeOrder = function (order) {
			    if (confirm('确定要取消这个订单?')) {
				$scope.orders.$child(order.$id).$remove();
			    }
			};
			$scope.canDelete = function (status) {
			    return status == '订单审核中';
			};
		    };

		    if ($rootScope.auth.user) {
			$rootScope.init_ctrl($rootScope.auth.user);
		    } else {
			$scope.orders = {};
		    }

		    $scope.products = Products;
		})

    .controller('CreateCtrl', function ($scope, $rootScope, $location, $timeout, $firebase, Products) {
		    $scope.init_info = function () {
			if ($scope.order === undefined)
			    $scope.order = {};
			if ($scope.info.address)
			    $scope.order.address = $scope.info.address;
			if ($scope.info.tel)
			    $scope.order.tel = $scope.info.tel;
			
			$scope.save_address = function () {
			    $scope.info.address = $scope.order.address;
			    $scope.info.tel = $scope.order.tel;
			    $scope.info.$save();
			    
			    $scope.info_change = true;
			    $timeout(function () { $scope.info_change = false;}, 1500);
			};		
		    };


		    $rootScope.init_ctrl = function (user) {
			$scope.user = user;

			var info_ref = new Firebase('https://my-adult-toy.firebaseio.com/users/'+$scope.user.uid+'/info');
			$scope.info = $firebase(info_ref);
			$scope.info.$on("change", $scope.init_info);

			var orders_ref = new Firebase('https://my-adult-toy.firebaseio.com/users/'+$scope.user.uid+'/orders');
			$scope.orders = $firebase(orders_ref);
			$scope.save = function () {
			    var date = new Date();
			    $scope.order.time = date.toLocaleString();
			    $scope.order.status = '订单审核中';
			    $scope.orders.$add($scope.order, function () {
						   $timeout(function () { $location.path('/');});
					       });
			};

			$scope.order = {};
			$scope.order.name = $scope.user.name;
			$scope.order.product = [];
			$scope.order.money = 0;

			$scope.calculateMoney = function () {
			    var money = 0;
			    var keys = $scope.products.$getIndex();
			    angular.forEach(keys, function (key, i) {
						if ($scope.order.product.indexOf(parseInt($scope.products[key].$id)) != -1) {
						    money += $scope.products[key].money;
						}
					    });
			    $scope.order.money = money;
			};
			$scope.inOrder = function (id) {
			    if ($scope.order.product.indexOf(id) != -1) {
				return true;
			    } else {
				return false;
			    }
			};
			$scope.addtoOrder = function (id) {
			    $scope.order.product.push(id);
			    $scope.order.product.sort();
			    $scope.calculateMoney();
			};
			$scope.removefromOrder = function (id) {
			    $scope.order.product.splice($scope.order.product.indexOf(id), 1);
			    $scope.order.product.sort();
			    $scope.calculateMoney();
			};

			$scope.getInfoStatus = function () {
			    return ($scope.newOrder.address.$error.required || $scope.newOrder.tel.$error.required
				    || $scope.newOrder.tel.$error.number);
			};
			$scope.getFormStatus = function () {
			    return ($scope.getInfoStatus() || $scope.order.money == 0);
			};
		    };

		    if ($rootScope.auth.user) {
			$rootScope.init_ctrl($rootScope.auth.user);
		    }

		    $scope.products = Products;

		});
