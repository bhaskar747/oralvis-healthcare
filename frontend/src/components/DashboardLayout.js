// frontend/src/components/DashboardLayout.js

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, CssBaseline, AppBar, Toolbar, List, Typography, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

export default function DashboardLayout({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = user?.role === 'admin' 
        ? [{ text: 'Admin Dashboard', path: '/admin-dashboard', icon: <DashboardIcon /> }]
        : [{ text: 'Patient Dashboard', path: '/patient-dashboard', icon: <DashboardIcon /> }];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        OralVis Health Portal
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar />
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => navigate(item.path)}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
