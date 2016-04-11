const CONF = {

	NEO4J_URL : "http://dadafamilytree.sb04.stations.graphenedb.com:24789/db/data/",

	GRAPH_OPTIONS : {
		layout: {
			improvedLayout:true,
			hierarchical: {
				enabled:true,
				sortMethod: "directed",
				levelSeparation: 150,
				nodeSpacing: 200,
				treeSpacing: 100,
				blockShifting: true,
				edgeMinimization: true,
				parentCentralization: true,
      			direction: 'UD',        // UD, DU, LR, RL
      		}
      	},
      	edges: {
      		smooth:true,
      		arrows: {to:true}
      	},
      	nodes: {
      		shape: "box",
      		color:{
      			highlight: {
      				border: '#2B7CE9'
      			},

      		}
      	}
      },
      COLORING_FEMALE:{
      	background:'#ff99ff', 
      	border:'#ff00ff',
      	highlight:{
      		background:'#ff99ff',
      		border:'#ff00ff'
      	},
      	hover:{

      	}
      },
      COLORING_MALE:{
      	background:'#66ccff',
      	border:'blue',
      	highlight:{
      		background:'#66ccff',
      		border:'blue'
      	},
      	hover:{
      		}
      	},

      }