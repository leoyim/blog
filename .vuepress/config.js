module.exports = {
  "title": "jingshui",
  "description": "LeoYimのblog",
  "dest": "public",
  "head": [
    [
      "link",
      {
        "rel": "icon",
        "href": "/favicon.ico"
      }
    ],
    [
      "meta",
      {
        "name": "viewport",
        "content": "width=device-width,initial-scale=1,user-scalable=no"
      }
    ]
  ],
  "theme": "reco",
  "themeConfig": {
    "nav": [
      {
        "text": "首页",
        "link": "/",
        "icon": "reco-home"
      },
      {
        "text": "时间线",
        "link": "/timeline/",
        "icon": "reco-date"
      },
      {
        "text": "笔记",
        "icon": "reco-message",
        "items": [
          {
            "text": "技术",
            "link": "/docs/wiki/"
          }
        ]
      },
      {
        "text": "链接",
        "icon": "reco-message",
        "items": [
          {
            "text": "GitHub",
            "link": "https://github.com/leoyim",
            "icon": "reco-github"
          }
        ]
      }
    ],
    "sidebar": {
      "/docs/wiki/": [
        "",
        "theme",
        "plugin",
        "api",
        "components"
      ]
    },
    "type": "blog",
    "blogConfig": {
      "category": {
        "location": 2,
        "text": "分类"
      },
      "tag": {
        "location": 3,
        "text": "标签"
      }
    },
    "friendLink": [
      {
        "title": "午后南杂",
        "desc": "Enjoy when you can, and endure when you must.",
        "email": "1156743527@qq.com",
        "link": "https://www.recoluan.com"
      },
      {
        "title": "vuepress-theme-reco",
        "desc": "A simple and beautiful vuepress Blog & Doc theme.",
        "avatar": "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
        "link": "https://vuepress-theme-reco.recoluan.com"
      }
    ],
    "logo": "/logo.png",
    "search": true,
    "searchMaxSuggestions": 10,
    "lastUpdated": "Last Updated",
    "author": "leoyim",
    "authorAvatar": "/avatar.png",
    "record": "豫ICP备2020035217号",
    "startYear": "2021",
    /**
     * support for
     * 'default'
     * 'funky'
     * 'okaidia'
     * 'solarizedlight'
     * 'tomorrow'
     */
    codeTheme: 'okaidia' // default 'tomorrow'
  },
  "markdown": {
    "lineNumbers": true
  },
  plugins: [
    [
      "@vuepress-reco/comments", 
      {
        solution: 'valine',
        options: {
          showComment: false,
          appId: '5zuUDPe9P76BKCAfCdaJLGJH-gzGzoHsz',// your appId
          appKey: 'OhpnjpGkNkWp8STP8TJ4bgdl', // your appKey
      }
    }],
    [
      "dynamic-title",
      {
        showIcon: "/favicon.ico",
        showText: "(/≧▽≦/)咦！又好了！",
        hideIcon: "/failure.ico",
        hideText: "(●—●)喔哟，崩溃啦！",
        recoverTime: 2000
    }],
    ["vuepress-plugin-nuggets-style-copy", {
      copyText: "复制代码",
      tip: {
          content: "复制成功!"
      }
    }],
    ['@vuepress-reco/vuepress-plugin-bulletin-popover', {
      width: '300px', // 默认 260px
      title: '消息提示',
      body: [
        {
          type: 'title',
          content: '欢迎访问静水博客！',
          style: 'text-aligin: center;'
        },
        {
          type: 'image',
          src: 'http://image.yanwenbo.net/qrcode.png'
        }
      ],
      // footer: [
      //   {
      //     type: 'button',
      //     text: '打赏',
      //     link: '/donate'
      //   }
      // ]
    }],
    [
      "Pagation",
      {
        total: 10,
        perPage: 10,
        currentPage: 1
      }
    ]
  ]
}